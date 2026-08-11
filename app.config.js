const isDev = process.env.APP_VARIANT === "development";

export default {
  expo: {
    name: isDev ? "R7-Pose (Dev)" : "R7-Pose",
    slug: "r7-pose",
    version: "1.3.0",
    orientation: "portrait",
    icon: isDev ? "./assets/images/dev-icon.png" : "./assets/images/icon.png",
    scheme: "r7pose",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: isDev ? "com.r7ptide.r7pose.dev" : "com.r7ptide.r7pose",
    },
    android: {
      package: isDev ? "com.r7ptide.r7pose.dev" : "com.r7ptide.r7pose",
      versionCode: 4,
      adaptiveIcon: isDev
        ? {
            backgroundColor: "#FFDD57",
            foregroundImage: "./assets/images/dev-icon.png",
            monochromeImage: "./assets/images/android-icon-monochrome.png",
          }
        : {
            backgroundColor: "#E6F4FE",
            foregroundImage: "./assets/images/android-icon-foreground.png",
            backgroundImage: "./assets/images/android-icon-background.png",
            monochromeImage: "./assets/images/android-icon-monochrome.png",
          },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
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
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-sqlite",
      "expo-font",
      "expo-image",
      "expo-sharing",
      "expo-status-bar",
      "expo-web-browser",
      "@react-native-community/datetimepicker",
      "@react-native-google-signin/google-signin",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "a5edc9d1-20fa-4eef-bfe2-c34b8aabbe34",
      },
    },
  },
};
