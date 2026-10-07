const { withProjectBuildGradle } = require("expo/config-plugins");

const SNIPPET = `
subprojects { subproject ->
  def alignKotlinJvm = {
    subproject.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
      compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
      }
    }
  }

  if (subproject.state.executed) {
    alignKotlinJvm()
  } else {
    subproject.afterEvaluate {
      alignKotlinJvm()
    }
  }
}
`;

/** Keep Kotlin on JVM 17 so it matches the Java compile target used by Expo modules. */
function withKotlinJvm17(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      return config;
    }
    if (!config.modResults.contents.includes("JvmTarget.JVM_17")) {
      config.modResults.contents += SNIPPET;
    }
    return config;
  });
}

module.exports = withKotlinJvm17;
