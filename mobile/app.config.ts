import type { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

const getUniqueIdentifier = () => {
  if (IS_DEV) return "com.jrsjackson26.rntemplate.dev";
  return "com.jrsjackson26.rntemplate";
};

const getAppName = () => {
  if (IS_DEV) return "rntemplate (Dev)";
  return "rntemplate";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "rntemplate",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: IS_DEV ? "rntemplate-dev" : "rntemplate",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: getUniqueIdentifier(),
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: getUniqueIdentifier(),
    googleServicesFile: "./google-services.json",
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      },
    ],
    "expo-sharing",
    "expo-font",
    "expo-localization",
    "expo-apple-authentication",
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.80154185842-n3acfnmflqdb42ggktc2ujckn3lq8phb",
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: process.env.SENTRY_PROJECT,
        organization: process.env.SENTRY_ORG,
      },
    ],
    "@sentry/react-native",
    "expo-sqlite",
    "expo-notifications",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
