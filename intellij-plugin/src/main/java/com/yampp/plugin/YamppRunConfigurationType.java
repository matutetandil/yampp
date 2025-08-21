package com.yampp.plugin;

import com.intellij.execution.configurations.ConfigurationFactory;
import com.intellij.execution.configurations.ConfigurationType;
import com.intellij.execution.configurations.RunConfiguration;
import com.intellij.openapi.project.Project;
import org.jetbrains.annotations.NotNull;

public class YamppRunConfigurationType implements ConfigurationType {
    @Override
    public String getDisplayName() {
        return "Yam++ Task";
    }

    @Override
    public String getConfigurationTypeDescription() {
        return "Run Yam++ tasks";
    }

    @Override
    public String getId() {
        return "YamppRunConfiguration";
    }

    @NotNull
    @Override
    public ConfigurationFactory[] getConfigurationFactories() {
        return new ConfigurationFactory[]{new YamppConfigurationFactory(this)};
    }
    
    private static class YamppConfigurationFactory extends ConfigurationFactory {
        public YamppConfigurationFactory(ConfigurationType type) {
            super(type);
        }

        @NotNull
        @Override
        public RunConfiguration createTemplateConfiguration(@NotNull Project project) {
            return new YamppRunConfiguration(project, this, "Yam++");
        }
    }
}