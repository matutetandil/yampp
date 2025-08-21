package com.yampp.plugin;

import com.intellij.execution.actions.ConfigurationContext;
import com.intellij.execution.actions.LazyRunConfigurationProducer;
import com.intellij.execution.configurations.ConfigurationFactory;
import com.intellij.openapi.util.Ref;
import com.intellij.psi.PsiElement;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

public class YamppRunConfigurationProducer extends LazyRunConfigurationProducer<YamppRunConfiguration> {

    @NotNull
    @Override
    public ConfigurationFactory getConfigurationFactory() {
        return YamppRunConfigurationType.getInstance().getConfigurationFactories()[0];
    }

    @Override
    protected boolean setupConfigurationFromContext(@NotNull YamppRunConfiguration configuration,
                                                     @NotNull ConfigurationContext context,
                                                     @NotNull Ref<PsiElement> sourceElement) {
        // TODO: Setup configuration from context
        // This is a stub implementation
        return false;
    }

    @Override
    public boolean isConfigurationFromContext(@NotNull YamppRunConfiguration configuration,
                                              @NotNull ConfigurationContext context) {
        // TODO: Check if configuration matches context
        // This is a stub implementation
        return false;
    }
}