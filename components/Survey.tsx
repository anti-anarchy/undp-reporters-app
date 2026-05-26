import dynamic from "next/dynamic";
import {
	Select,
	Button,
	Drawer,
	Checkbox,
	Radio,
	Textarea,
	Stack,
	ScrollArea
} from "@mantine/core";
import {
	IconAsterisk,
	IconCamera,
	IconPhoto,
	IconX
} from "@tabler/icons-react";
import { useFormik } from "formik";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const PinDropMap = dynamic(() => import("@/components/PinDropMap"), {
	ssr: false,
	loading: () => (
		<div className="flex h-48 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
			Loading map...
		</div>
	)
});

function RequiredStar() {
	return (
		<IconAsterisk
			size={8}
			stroke={3}
			className="mb-2 ml-0.5 inline text-red-500"
		/>
	);
}

export default function Survey({
	surveyOpen,
	setSurveyOpen
}: {
	surveyOpen: boolean;
	setSurveyOpen: (opt: boolean) => void;
}) {
	const { t } = useTranslation("common");

	const INCIDENT_TYPES = [
		{ value: "earthquake", label: t("incident.earthquake") },
		{ value: "wildfire", label: t("incident.wildfire") },
		{ value: "flood", label: t("incident.flood") },
		{ value: "landslide", label: t("incident.landslide") }
	];

	const INFRASTRUCTURE_OPTIONS = [
		{ value: "residential", label: t("infra.residential.label"), description: t("infra.residential.desc") },
		{ value: "commercial", label: t("infra.commercial.label"), description: t("infra.commercial.desc") },
		{ value: "government", label: t("infra.government.label"), description: t("infra.government.desc") },
		{ value: "utility", label: t("infra.utility.label"), description: t("infra.utility.desc") },
		{ value: "transport", label: t("infra.transport.label"), description: t("infra.transport.desc") },
		{ value: "community", label: t("infra.community.label"), description: t("infra.community.desc") },
		{ value: "recreation", label: t("infra.recreation.label"), description: t("infra.recreation.desc") },
		{ value: "other", label: t("infra.other.label"), description: "" }
	];

	const DAMAGE_OPTIONS = [
		{ value: "minimal", label: t("damage.minimal.label"), description: t("damage.minimal.desc") },
		{ value: "partial", label: t("damage.partial.label"), description: t("damage.partial.desc") },
		{ value: "complete", label: t("damage.complete.label"), description: t("damage.complete.desc") }
	];

	const formik = useFormik({
		initialValues: {
			incidentType: "earthquake",
			infrastructure: [] as string[],
			otherText: "",
			infraName: "",
			infraCount: "",
			damageLevel: "",
			debris: "",
			description: "",
			location: null as [number, number] | null
		},
		onSubmit: (values) => {
			console.log({ ...values, photos });
		}
	});

	const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
	const cameraRef = useRef<HTMLInputElement>(null);
	const galleryRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		return () => photos.forEach((p) => URL.revokeObjectURL(p.preview));
	}, []);

	const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		const newPhotos = files.map((file) => ({
			file,
			preview: URL.createObjectURL(file)
		}));
		setPhotos((prev) => [...prev, ...newPhotos]);
		e.target.value = "";
	};

	const removePhoto = (index: number) => {
		setPhotos((prev) => {
			URL.revokeObjectURL(prev[index].preview);
			return prev.filter((_, i) => i !== index);
		});
	};

	return (
		<Drawer
			opened={surveyOpen}
			onClose={() => setSurveyOpen(false)}
			position="bottom"
			size="90%"
			title={<strong className="text-lg">{t("survey.reportIncident")}</strong>}
			styles={{
				header: { padding: "1rem 1rem 0.5rem" },
				body: {
					padding: "0 1rem 1rem",
					display: "flex",
					flexDirection: "column",
					height: "calc(100% - 60px)",
					overflow: "hidden"
				}
			}}>
			<form
				onSubmit={formik.handleSubmit}
				className="flex h-full flex-col overflow-hidden">
				{/* Incident type */}
				<Select
					data={INCIDENT_TYPES}
					value={formik.values.incidentType}
					onChange={(v) =>
						formik.setFieldValue("incidentType", v ?? "earthquake")
					}
					mb="xl"
					comboboxProps={{ withinPortal: true }}
					styles={{
						input: {
							textAlign: "center",
							fontWeight: 600,
							fontSize: "1.1rem",
							border: "1px solid #e5e7eb",
							borderRadius: "0.5rem"
						}
					}}
				/>

				<ScrollArea style={{ flex: 1 }} pr={16} mb={16}>
					<Stack gap="xl" pb="sm">
						{/* Q1 */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								{t("survey.q1.title")}
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								{t("survey.q1.subtitle")}
							</span>
							<Checkbox.Group
								value={formik.values.infrastructure}
								onChange={(v) => formik.setFieldValue("infrastructure", v)}>
								<Stack gap="sm">
									{INFRASTRUCTURE_OPTIONS.map((opt) => (
										<Checkbox
											key={opt.value}
											value={opt.value}
											label={
												<div>
													<span className="text-sm">{opt.label}</span>
													{opt.description && (
														<p className="text-xs text-gray-500">
															({opt.description})
														</p>
													)}
												</div>
											}
										/>
									))}
								</Stack>
							</Checkbox.Group>
							{formik.values.infrastructure.includes("other") && (
								<Textarea
									name="otherText"
									placeholder={t("survey.pleaseSpecify")}
									value={formik.values.otherText}
									onChange={formik.handleChange}
									size="sm"
									ml="xl"
									autosize
									minRows={2}
								/>
							)}
						</Stack>

						{/* Q2 */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								{t("survey.q2.title")}
							</p>
							<span className="text-xs text-gray-500">
								{t("survey.q2.subtitle")}
							</span>
							<Textarea
								name="infraName"
								value={formik.values.infraName}
								onChange={formik.handleChange}
								size="sm"
								ml="xl"
								autosize
								minRows={2}
							/>
						</Stack>

						{/* Q3 */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								{t("survey.q3.title")}
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								{t("survey.q3.subtitle")}
							</span>
							<Radio.Group
								value={formik.values.infraCount}
								onChange={(v) => formik.setFieldValue("infraCount", v)}>
								<Stack gap="sm">
									{["1", "2 - 5", "6 - 20", "More than 20"].map((opt) => (
										<Radio key={opt} value={opt} label={opt} />
									))}
								</Stack>
							</Radio.Group>
						</Stack>

						{/* Q4 */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								{t("survey.q4.title")}
								<RequiredStar />
							</p>
							<Radio.Group
								value={formik.values.damageLevel}
								onChange={(v) => formik.setFieldValue("damageLevel", v)}>
								<Stack gap="sm">
									{DAMAGE_OPTIONS.map((opt) => (
										<div
											key={opt.value}
											className={`cursor-pointer rounded-lg border p-3 transition-colors ${
												formik.values.damageLevel === opt.value
													? "border-gray-800 bg-gray-50"
													: "border-gray-200"
											}`}>
											<Radio
												value={opt.value}
												label={
													<div>
														<span className="text-sm font-medium">
															{opt.label}
														</span>
														<p className="text-xs text-gray-500">
															{opt.description}
														</p>
													</div>
												}
											/>
										</div>
									))}
								</Stack>
							</Radio.Group>
						</Stack>

						{/* Q5 */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								{t("survey.q5.title")}
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								{t("survey.q5.subtitle")}
							</span>
							<Radio.Group
								value={formik.values.debris}
								onChange={(v) => formik.setFieldValue("debris", v)}>
								<Stack gap="sm">
									<Radio value="yes" label={t("survey.q5.yes")} />
									<Radio value="no" label={t("survey.q5.no")} />
								</Stack>
							</Radio.Group>
						</Stack>

						{/* Q6 — Location */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								{t("survey.q6.title")}
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								{t("survey.q6.subtitle")}
							</span>
							{formik.values.location && (
								<span className="text-xs text-teal-600">
									{t("survey.pinSetAt")}{" "}
									{formik.values.location[0].toFixed(5)},{" "}
									{formik.values.location[1].toFixed(5)}
								</span>
							)}
							<PinDropMap
								value={formik.values.location}
								onChange={(latlng) => formik.setFieldValue("location", latlng)}
							/>
						</Stack>

						{/* Q7 — Description */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								{t("survey.q7.title")}{" "}
								<span className="font-normal text-gray-400">
									({t("survey.optional")})
								</span>
							</p>
							<span className="text-xs text-gray-500">
								{t("survey.describeHint")}
							</span>
							<Textarea
								name="description"
								value={formik.values.description}
								onChange={formik.handleChange}
								placeholder={t("survey.descriptionPlaceholder")}
								size="sm"
								autosize
								minRows={3}
							/>
						</Stack>

						{/* Q8 — Photo Upload */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								{t("survey.q8.title")}
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								{t("survey.photoOfDamage")}
							</span>

							{/* Hidden file inputs */}
							<input
								ref={cameraRef}
								type="file"
								accept="image/*"
								capture="environment"
								className="hidden"
								onChange={handlePhotoSelect}
							/>
							<input
								ref={galleryRef}
								type="file"
								accept="image/*"
								multiple
								className="hidden"
								onChange={handlePhotoSelect}
							/>

							{/* Thumbnails */}
							{photos.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{photos.map((p, i) => (
										<div key={i} className="relative h-24 w-24 flex-shrink-0">
											<img
												src={p.preview}
												alt={`photo-${i}`}
												className="h-full w-full object-cover"
											/>
											<button
												type="button"
												onClick={() => removePhoto(i)}
												className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white">
												<IconX size={10} stroke={2.5} />
											</button>
										</div>
									))}
								</div>
							)}

							{/* Upload buttons */}
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => cameraRef.current?.click()}
									className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:bg-gray-50">
									<IconCamera size={16} />
									{t("survey.camera")}
								</button>
								<button
									type="button"
									onClick={() => galleryRef.current?.click()}
									className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:bg-gray-50">
									<IconPhoto size={16} />
									{t("survey.gallery")}
								</button>
							</div>
						</Stack>
					</Stack>
				</ScrollArea>

				<Button type="submit" fullWidth color="dark" radius="xl" size="md">
					{t("survey.submitReport")}
				</Button>
			</form>
		</Drawer>
	);
}
