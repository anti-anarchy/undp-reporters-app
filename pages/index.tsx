import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Select, ActionIcon, Button, Group } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import type { GetStaticProps } from "next";
import Survey from "@/components/Survey";

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
	const router = useRouter();
	const { t } = useTranslation("common");
	const [surveyOpen, setSurveyOpen] = useState(false);

	const currentLocale = router.locale ?? "en";
	const langAbbrev =
		LANGUAGES.find((l) => l.value === currentLocale)
			?.label.slice(0, 2)
			.toUpperCase() ?? "EN";

	const handleLocaleChange = (v: string | null) => {
		if (!v) return;
		router.push(router.pathname, router.asPath, { locale: v });
	};

	return (
		<div className="flex h-screen flex-col" style={{ background: "#f0eee6" }}>
			<div className="mx-auto w-full max-w-sm px-4 pt-8">
				{/* Language selector */}
				<div className="mb-8 flex justify-center">
					<Select
						data={LANGUAGES}
						value={currentLocale}
						onChange={handleLocaleChange}
						leftSection={
							<span className="rounded bg-[#e5e3db] px-1.5 py-0.5 text-xs font-semibold">
								{langAbbrev}
							</span>
						}
						leftSectionWidth={48}
					/>
				</div>

				{/* Report heading + actions */}
				<p className="mb-2 text-xl font-bold">{t("reportIncidence")}</p>
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
						{t("fillSurvey")}
					</Button>
				</Group>
			</div>

			{/* Map fills remaining space */}
			<div className="flex-1 overflow-hidden">
				<Map />
			</div>

			{/* Survey Drawer */}
			<Survey setSurveyOpen={setSurveyOpen} surveyOpen={surveyOpen} />
		</div>
	);
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? "en", ["common"]))
	}
});
