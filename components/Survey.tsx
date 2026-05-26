import dynamic from "next/dynamic";
import {
	Select,
	Button,
	Drawer,
	Checkbox,
	Radio,
	TextInput,
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

const PinDropMap = dynamic(() => import("@/components/PinDropMap"), {
	ssr: false,
	loading: () => (
		<div className="flex h-48 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
			Loading map...
		</div>
	)
});

const INCIDENT_TYPES = [
	{ value: "earthquake", label: "Earthquake" },
	{ value: "wildfire", label: "Wildfire" },
	{ value: "flood", label: "Flood" },
	{ value: "landslide", label: "Landslide" }
];

const INFRASTRUCTURE_OPTIONS = [
	{
		value: "residential",
		label: "Residential Infrastructure",
		description: "Houses and apartments"
	},
	{
		value: "commercial",
		label: "Commercial Infrastructure",
		description: "Markets, malls, shops, hotels, banks, industries, etc."
	},
	{
		value: "government",
		label: "Government Building",
		description:
			"Administrative buildings, courthouses, police stations, fire stations, etc."
	},
	{
		value: "utility",
		label: "Utility Infrastructure",
		description: "Water pumps, power plants, waste treatment plants, etc."
	},
	{
		value: "transport",
		label: "Transport and Communication Infrastructure",
		description:
			"Roads, cell towers, bridges, railway station, bus station, etc."
	},
	{
		value: "community",
		label: "Community Infrastructure",
		description: "Schools, hospitals, community halls, public toilets, etc."
	},
	{
		value: "recreation",
		label: "Public Spaces / Recreation Infrastructure",
		description: "Stadiums, playgrounds, religious buildings, etc."
	},
	{
		value: "other",
		label: "Other",
		description: ""
	}
];

const DAMAGE_OPTIONS = [
	{
		value: "minimal",
		label: "Minimal / No damage",
		description:
			"Structurally sound and functional, showing only cosmetic or no visible damage"
	},
	{
		value: "partial",
		label: "Partially damaged",
		description: "Repairable, and remains usable with caution"
	},
	{
		value: "complete",
		label: "Completely damaged",
		description: "Structurally unsafe or destroyed"
	}
];

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
			title={<strong className="text-lg">Report Incident</strong>}
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
								Q1. Infrastructure affected
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								Select all that apply
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
									placeholder="Please specify"
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
								Q2. Name(s) of Infrastructure
							</p>
							<span className="text-xs text-gray-500">
								Please provide the name of the infrastructure if present ex: The
								Mirage, Westlands Primary
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
								Q3. Number of infrastructure affected
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								Give an approximate figure
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
								Q4. Level of damage
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
								Q5. Debris
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								Is there any debris that requires clearing on or near the
								infrastructure site?
							</span>
							<Radio.Group
								value={formik.values.debris}
								onChange={(v) => formik.setFieldValue("debris", v)}>
								<Stack gap="sm">
									<Radio
										value="yes"
										label="YES, there is debris in need of clearing"
									/>
									<Radio
										value="no"
										label="NO, there is no debris in need of clearing"
									/>
								</Stack>
							</Radio.Group>
						</Stack>

						{/* Q6 — Location */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								Q6. Disaster Location
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								Tap on the map to drop a pin at the affected location
							</span>
							{formik.values.location && (
								<span className="text-xs text-teal-600">
									Pin set at {formik.values.location[0].toFixed(5)},{" "}
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
								Q7. Description{" "}
								<span className="font-normal text-gray-400">(optional)</span>
							</p>
							<span className="text-xs text-gray-500">
								Briefly describe what happened
							</span>
							<Textarea
								name="description"
								value={formik.values.description}
								onChange={formik.handleChange}
								placeholder="e.g. The building collapsed after the tremor at around 6am..."
								size="sm"
								autosize
								minRows={3}
							/>
						</Stack>

						{/* Q8 — Photo Upload */}
						<Stack gap="xs">
							<p className="text-sm font-semibold">
								Q8. Photo Upload
								<RequiredStar />
							</p>
							<span className="text-xs text-gray-500">
								Photo of the damaged infrastructure
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
												className="h-full w-full  object-cover"
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
									Camera
								</button>
								<button
									type="button"
									onClick={() => galleryRef.current?.click()}
									className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:bg-gray-50">
									<IconPhoto size={16} />
									Gallery
								</button>
							</div>
						</Stack>
					</Stack>
				</ScrollArea>

				<Button type="submit" fullWidth color="dark" radius="xl" size="md">
					Submit report
				</Button>
			</form>
		</Drawer>
	);
}
