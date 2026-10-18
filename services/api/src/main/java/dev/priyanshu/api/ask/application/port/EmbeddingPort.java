package dev.priyanshu.api.ask.application.port;

public interface EmbeddingPort {
    float[] embed(String text);
    int getDimension();
    String getModelName();
}
