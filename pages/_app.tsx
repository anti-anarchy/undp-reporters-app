import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { createTheme, MantineProvider } from "@mantine/core";
import { appWithTranslation } from "next-i18next/pages";

const theme = createTheme({
	fontFamily: "DMSans",
	primaryColor: "dark"
});

function App({ Component, pageProps }: AppProps) {
	return (
		<MantineProvider theme={theme}>
			<Component {...pageProps} />
		</MantineProvider>
	);
}

export default appWithTranslation(App);
