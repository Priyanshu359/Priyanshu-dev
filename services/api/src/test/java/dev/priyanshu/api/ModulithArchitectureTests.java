package dev.priyanshu.api;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModulithArchitectureTests {

    @Test
    void verifyModulithStructure() {
        ApplicationModules modules = ApplicationModules.of(ApiApplication.class);
        modules.verify();
    }
}
