import type { NextApiRequest, NextApiResponse } from "next";

const FARAJA = (process.env.FARAJA_API_URL || "http://127.0.0.1:8500").replace(/\/+$/, "");

// Surface what URL the proxy is actually using — printed once at server boot.
console.log(`[faraja-proxy] FARAJA_API_URL = ${FARAJA}`);

type StartBody = { action: "start" };
type MessageBody = { action: "message"; session_id: string; message: string };
type Body = StartBody | MessageBody | Record<string, unknown>;

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		return res.status(405).json({ error: "method not allowed" });
	}

	const body = (req.body || {}) as Body;
	const action = (body as { action?: string }).action;

	try {
		if (action === "start") {
			const r = await fetch(`${FARAJA}/intake/session`, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			});
			const data = await r.json().catch(() => ({}));
			if (!r.ok) return res.status(r.status).json({ error: "faraja " + r.status, data });
			return res.status(200).json(data);
		}

		if (action === "message") {
			const { session_id, message } = body as MessageBody;
			if (!session_id || !message) {
				return res.status(400).json({ error: "session_id and message are required" });
			}
			const r = await fetch(
				`${FARAJA}/intake/session/${encodeURIComponent(session_id)}/message`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ message })
				}
			);
			const data = await r.json().catch(() => ({}));
			if (!r.ok) return res.status(r.status).json({ error: "faraja " + r.status, data });
			return res.status(200).json(data);
		}

		return res.status(400).json({ error: "unknown action; expected 'start' or 'message'" });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		const cause = e instanceof Error && e.cause ? String((e as { cause?: unknown }).cause) : "";
		console.error(`[faraja-proxy] ${action || "?"} → ${FARAJA} FAILED: ${msg}${cause ? " | cause: " + cause : ""}`);
		return res.status(502).json({ error: "proxy failed: " + msg, target: FARAJA });
	}
}
