import { useRef, useState, useEffect, useCallback } from "react";
import {
	Drawer,
	TextInput,
	ActionIcon,
	Text,
	Stack,
	Paper,
	Group,
	Loader,
	Button,
	Checkbox,
	UnstyledButton
} from "@mantine/core";
import { IconSend, IconRefresh } from "@tabler/icons-react";

type Role = "user" | "assistant" | "system";
type Status = "idle" | "active" | "conversing" | "completed";
type InputType = "text" | "single_select" | "multi_select" | "boolean" | "geo" | "none";

interface Option {
	value: string;
	label: string;
	hint?: string;
}

interface InputSpec {
	type: InputType;
	options: Option[];
	help?: string | null;
	optional?: boolean;
}

interface Message {
	role: Role;
	content: string;
}

interface ApiTurn {
	session_id: string;
	message: string;
	step: number;
	total_steps: number;
	status: Status;
	case_id?: string | null;
	input?: InputSpec;
}

interface ChatBotProps {
	opened: boolean;
	onClose: () => void;
}

export default function ChatBot({ opened, onClose }: ChatBotProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [status, setStatus] = useState<Status>("idle");
	const [input, setInput] = useState<InputSpec | null>(null);
	const [caseId, setCaseId] = useState<string | null>(null);
	const [text, setText] = useState("");
	const [loading, setLoading] = useState(false);
	const [starting, setStarting] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loading, input]);

	const start = useCallback(async () => {
		if (starting) return;
		setStarting(true);
		setMessages([]);
		setSessionId(null);
		setInput(null);
		setStatus("idle");
		setCaseId(null);
		setText("");
		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "start" })
			});
			const data = (await res.json()) as ApiTurn & { error?: string };
			if (!res.ok) throw new Error(data.error || `start failed (${res.status})`);
			setSessionId(data.session_id);
			setMessages([{ role: "assistant", content: data.message }]);
			setInput(data.input ?? { type: "text", options: [] });
			setStatus(data.status || "active");
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			setMessages([
				{
					role: "assistant",
					content:
						"I could not reach the response system. Please ensure the backend is running.\n\nDetails: " +
						msg
				}
			]);
		} finally {
			setStarting(false);
		}
	}, [starting]);

	// Auto-start when the drawer is opened for the first time
	useEffect(() => {
		if (opened && !sessionId && !starting) {
			start();
		}
	}, [opened, sessionId, starting, start]);

	async function send(value: string, displayLabel?: string) {
		if (!sessionId || loading || starting) return;
		const pretty = (displayLabel || value).trim();
		if (!pretty) return;
		setMessages((prev) => [...prev, { role: "user", content: pretty }]);
		setText("");
		setInput(null);
		setLoading(true);
		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "message", session_id: sessionId, message: value })
			});
			const data = (await res.json()) as ApiTurn & { error?: string };
			if (!res.ok) {
				if (res.status === 404) {
					setMessages((prev) => [
						...prev,
						{ role: "system", content: "Session expired — starting a fresh one." }
					]);
					await start();
					return;
				}
				throw new Error(data.error || `request failed (${res.status})`);
			}
			setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
			setInput(data.input ?? { type: "text", options: [] });
			setStatus(data.status || "active");
			if (data.case_id) setCaseId(data.case_id);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			setMessages((prev) => [...prev, { role: "assistant", content: "Error: " + msg }]);
		} finally {
			setLoading(false);
		}
	}

	const headerSubtitle =
		status === "conversing"
			? `Talking with Faraja${caseId ? ` — case ${caseId}` : ""}`
			: status === "completed"
				? `Ended${caseId ? ` — case ${caseId}` : ""}`
				: status === "active" && input
					? `Step ${Math.max(0, Math.min((messages.filter((m) => m.role === "assistant").length || 1) - 1, 99))} — answer below`
					: "Faraja — crisis response assistant";

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="bottom"
			size="100%"
			title={
				<Group gap="xs">
					<Text fw={600}>Faraja</Text>
					<Text size="xs" c="dimmed">
						{headerSubtitle}
					</Text>
				</Group>
			}
			styles={{
				body: {
					display: "flex",
					flexDirection: "column",
					height: "calc(100dvh - 60px)",
					padding: 0
				}
			}}>
			{/* Messages */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "var(--mantine-spacing-md)"
				}}>
				<Stack gap="sm">
					{messages.length === 0 && !starting && (
						<Text size="sm" c="dimmed" ta="center" mt="xl">
							Welcome. Faraja will start the intake when you are ready.
						</Text>
					)}
					{messages.map((msg, i) => (
						<div
							key={i}
							style={{
								display: "flex",
								justifyContent:
									msg.role === "user"
										? "flex-end"
										: msg.role === "system"
											? "center"
											: "flex-start"
							}}>
							{msg.role === "system" ? (
								<Text size="xs" c="dimmed" fs="italic">
									{msg.content}
								</Text>
							) : (
								<Paper
									px="md"
									py="sm"
									radius="md"
									bg={msg.role === "user" ? "dark" : "gray.1"}
									style={{ maxWidth: "80%" }}>
									<Text
										size="sm"
										c={msg.role === "user" ? "white" : "dark"}
										style={{ whiteSpace: "pre-wrap" }}>
										{msg.content}
									</Text>
								</Paper>
							)}
						</div>
					))}
					{(loading || starting) && (
						<div style={{ display: "flex", justifyContent: "flex-start" }}>
							<Paper px="md" py="sm" radius="md" bg="gray.1">
								<Group gap="xs">
									<Loader size="xs" color="dark" />
									<Text size="xs" c="dimmed">
										Faraja is typing…
									</Text>
								</Group>
							</Paper>
						</div>
					)}
					<div ref={bottomRef} />
				</Stack>
			</div>

			{/* Composer */}
			<div
				style={{
					borderTop: "1px solid var(--mantine-color-gray-2)",
					padding: "var(--mantine-spacing-md)"
				}}>
				{renderComposer({
					input,
					status,
					loading,
					starting,
					text,
					setText,
					send,
					start
				})}
			</div>
		</Drawer>
	);
}

/* ---------- Composer renderers ---------- */

interface ComposerProps {
	input: InputSpec | null;
	status: Status;
	loading: boolean;
	starting: boolean;
	text: string;
	setText: (v: string) => void;
	send: (value: string, displayLabel?: string) => void;
	start: () => void;
}

function renderComposer(p: ComposerProps) {
	if (p.starting)
		return (
			<Text size="sm" c="dimmed" ta="center">
				Connecting to Faraja…
			</Text>
		);
	if (p.status === "completed" || !p.input || p.input.type === "none") {
		return (
			<Group justify="center">
				<Button leftSection={<IconRefresh size={16} />} onClick={p.start}>
					Start a new session
				</Button>
			</Group>
		);
	}
	if (p.input.type === "multi_select") return <MultiSelect input={p.input} disabled={p.loading} onSubmit={p.send} />;
	if (p.input.type === "single_select") return <SingleSelect input={p.input} disabled={p.loading} onSelect={p.send} />;
	if (p.input.type === "boolean") return <BooleanInput disabled={p.loading} onAnswer={p.send} help={p.input.help} />;
	return <TextComposer {...p} />;
}

function MultiSelect({
	input,
	disabled,
	onSubmit
}: {
	input: InputSpec;
	disabled: boolean;
	onSubmit: (v: string, d: string) => void;
}) {
	const [selected, setSelected] = useState<string[]>([]);
	const toggle = (v: string, checked: boolean) =>
		setSelected((prev) => (checked ? [...prev, v] : prev.filter((x) => x !== v)));
	const submit = () => {
		if (!selected.length) return;
		const labels = selected
			.map((v) => input.options.find((o) => o.value === v)?.label || v)
			.join(", ");
		onSubmit(selected.join(", "), labels);
		setSelected([]);
	};
	return (
		<Stack gap="xs">
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
					gap: 6
				}}>
				{input.options.map((o) => (
					<Paper
						key={o.value}
						withBorder
						p="xs"
						style={{
							borderColor: selected.includes(o.value)
								? "var(--mantine-color-dark-5)"
								: undefined
						}}>
						<Checkbox
							checked={selected.includes(o.value)}
							onChange={(e) => toggle(o.value, e.currentTarget.checked)}
							label={
								<div>
									<Text size="sm" fw={500}>
										{o.label}
									</Text>
									{o.hint && (
										<Text size="xs" c="dimmed">
											{o.hint}
										</Text>
									)}
								</div>
							}
						/>
					</Paper>
				))}
			</div>
			{input.help && (
				<Text size="xs" c="dimmed">
					{input.help}
				</Text>
			)}
			<Group justify="flex-end" gap="xs">
				{input.optional && (
					<Button variant="subtle" onClick={() => onSubmit("skip", "(skipped)")} disabled={disabled}>
						Skip
					</Button>
				)}
				<Button onClick={submit} disabled={disabled || !selected.length}>
					Submit
				</Button>
			</Group>
		</Stack>
	);
}

function SingleSelect({
	input,
	disabled,
	onSelect
}: {
	input: InputSpec;
	disabled: boolean;
	onSelect: (v: string, d: string) => void;
}) {
	return (
		<Stack gap="xs">
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
					gap: 6
				}}>
				{input.options.map((o) => (
					<UnstyledButton
						key={o.value}
						onClick={() => onSelect(o.value, o.label)}
						disabled={disabled}
						style={{
							borderRadius: 8,
							border: "1px solid var(--mantine-color-gray-3)",
							padding: "10px 12px",
							textAlign: "left",
							background: "white",
							cursor: disabled ? "not-allowed" : "pointer",
							opacity: disabled ? 0.5 : 1
						}}>
						<Text size="sm" fw={500}>
							{o.label}
						</Text>
						{o.hint && (
							<Text size="xs" c="dimmed" mt={2}>
								{o.hint}
							</Text>
						)}
					</UnstyledButton>
				))}
			</div>
			{input.help && (
				<Text size="xs" c="dimmed">
					{input.help}
				</Text>
			)}
			{input.optional && (
				<Group justify="flex-end">
					<Button variant="subtle" onClick={() => onSelect("skip", "(skipped)")} disabled={disabled}>
						Skip
					</Button>
				</Group>
			)}
		</Stack>
	);
}

function BooleanInput({
	disabled,
	onAnswer,
	help
}: {
	disabled: boolean;
	onAnswer: (v: string, d: string) => void;
	help?: string | null;
}) {
	return (
		<Stack gap="xs">
			<Group grow gap="xs">
				<Button color="dark" size="md" onClick={() => onAnswer("yes", "Yes")} disabled={disabled}>
					Yes
				</Button>
				<Button variant="default" size="md" onClick={() => onAnswer("no", "No")} disabled={disabled}>
					No
				</Button>
			</Group>
			{help && (
				<Text size="xs" c="dimmed">
					{help}
				</Text>
			)}
		</Stack>
	);
}

function TextComposer(p: ComposerProps) {
	const conversing = p.status === "conversing";
	const trySend = () => {
		const v = p.text.trim();
		if (v) p.send(v);
	};
	return (
		<Stack gap="xs">
			<Group gap="xs" align="flex-start">
				<TextInput
					flex={1}
					placeholder={conversing ? "Share what is on your mind…" : "Type your reply…"}
					value={p.text}
					onChange={(e) => p.setText(e.currentTarget.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							trySend();
						}
					}}
					disabled={p.loading}
				/>
				<ActionIcon
					size="lg"
					variant="filled"
					color="dark"
					onClick={trySend}
					disabled={p.loading || !p.text.trim()}>
					<IconSend size={16} />
				</ActionIcon>
			</Group>
			{p.input?.help && (
				<Text size="xs" c="dimmed">
					{p.input.help}
				</Text>
			)}
			<Group gap="xs" justify="flex-end">
				{p.input?.optional && (
					<Button
						variant="subtle"
						size="xs"
						onClick={() => p.send("skip", "(skipped)")}
						disabled={p.loading}>
						Skip
					</Button>
				)}
				{conversing && (
					<Button
						variant="light"
						color="red"
						size="xs"
						onClick={() => p.send("goodbye", "Goodbye")}
						disabled={p.loading}>
						Say goodbye
					</Button>
				)}
			</Group>
		</Stack>
	);
}
