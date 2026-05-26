import { useState } from "react";
import dynamic from "next/dynamic";
import { Select, ActionIcon, Button, Group } from "@mantine/core";
import { IconPencil, IconArrowUpRight } from "@tabler/icons-react";
import Survery from "@/components/Survey";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const LANGUAGES = [
	{ value: "ar", label: "Arabic" },
	{ value: "zh", label: "Chinese" },
	{ value: "en", label: "English" },
	{ value: "fr", label: "French" },
	{ value: "ru", label: "Russian" },
	{ value: "es", label: "Spanish" }
];

export default function Home() {
	const [language, setLanguage] = useState("en");
	const [surveyOpen, setSurveyOpen] = useState(false);

	const langAbbrev =
		LANGUAGES.find((l) => l.value === language)
			?.label.slice(0, 2)
			.toUpperCase() ?? "EN";

	return (
		<div className="flex h-screen flex-col" style={{ background: "#f0eee6" }}>
			<div className="mx-auto w-full max-w-sm px-4 pt-8">
				{/* Language selector */}
				<div className="mb-8 flex justify-center">
					<Select
						data={LANGUAGES}
						value={language}
						onChange={(v) => setLanguage(v ?? "en")}
						leftSection={
							<span className="rounded bg-[#e5e3db] px-1.5 py-0.5 text-xs font-semibold">
								{langAbbrev}
							</span>
						}
						leftSectionWidth={48}
					/>
				</div>

				{/* Report heading + actions */}
				<p className="mb-2 text-xl font-bold">Report an incidence</p>
				<Group mb="md" gap="sm" wrap="nowrap">
					<ActionIcon
						variant="filled"
						size={44}
						radius="xl"
						style={{ background: "#d1d5db", color: "#374151", flexShrink: 0 }}>
						<IconPencil size={18} />
					</ActionIcon>
					<Button
						fullWidth
						radius="xl"
						size="md"
						color="dark"
						onClick={() => setSurveyOpen(true)}>
						Fill survey
					</Button>
				</Group>
			</div>

			{/* Map fills remaining space */}
			<div className="flex-1 overflow-hidden">
				<Map />
			</div>

			{/* Survey Drawer */}
			<Survery setSurveyOpen={setSurveyOpen} surveyOpen={surveyOpen} />
		</div>
	);
}
