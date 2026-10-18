package dev.priyanshu.api.platform;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "priyanshu")
public class PlatformProperties {

    private Cors cors = new Cors();
    private RateLimit rateLimit = new RateLimit();
    private Outbox outbox = new Outbox();
    private Notification notification = new Notification();
    private Lab lab = new Lab();

    public Cors getCors() {
        return cors;
    }

    public void setCors(Cors cors) {
        this.cors = cors;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(RateLimit rateLimit) {
        this.rateLimit = rateLimit;
    }

    public Outbox getOutbox() {
        return outbox;
    }

    public void setOutbox(Outbox outbox) {
        this.outbox = outbox;
    }

    public Notification getNotification() {
        return notification;
    }

    public void setNotification(Notification notification) {
        this.notification = notification;
    }

    public Lab getLab() {
        return lab;
    }

    public void setLab(Lab lab) {
        this.lab = lab;
    }

    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:3000", "https://priyanshu.dev");

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public static class RateLimit {
        private Global global = new Global();
        private Contact contact = new Contact();

        public Global getGlobal() {
            return global;
        }

        public void setGlobal(Global global) {
            this.global = global;
        }

        public Contact getContact() {
            return contact;
        }

        public void setContact(Contact contact) {
            this.contact = contact;
        }

        public static class Global {
            private long capacity = 60;
            private long refillTokens = 60;
            private long refillPeriodSeconds = 60;

            public long getCapacity() {
                return capacity;
            }

            public void setCapacity(long capacity) {
                this.capacity = capacity;
            }

            public long getRefillTokens() {
                return refillTokens;
            }

            public void setRefillTokens(long refillTokens) {
                this.refillTokens = refillTokens;
            }

            public long getRefillPeriodSeconds() {
                return refillPeriodSeconds;
            }

            public void setRefillPeriodSeconds(long refillPeriodSeconds) {
                this.refillPeriodSeconds = refillPeriodSeconds;
            }
        }

        public static class Contact {
            private long hourlyIpLimit = 3;

            public long getHourlyIpLimit() {
                return hourlyIpLimit;
            }

            public void setHourlyIpLimit(long hourlyIpLimit) {
                this.hourlyIpLimit = hourlyIpLimit;
            }
        }
    }

    public static class Outbox {
        private String streamName = "app:events";
        private long pollingIntervalMs = 1000;
        private int batchSize = 50;

        public String getStreamName() {
            return streamName;
        }

        public void setStreamName(String streamName) {
            this.streamName = streamName;
        }

        public long getPollingIntervalMs() {
            return pollingIntervalMs;
        }

        public void setPollingIntervalMs(long pollingIntervalMs) {
            this.pollingIntervalMs = pollingIntervalMs;
        }

        public int getBatchSize() {
            return batchSize;
        }

        public void setBatchSize(int batchSize) {
            this.batchSize = batchSize;
        }
    }

    public static class Notification {
        private String toEmail = "priyanshu.kr.sinha74@gmail.com";
        private String fromEmail = "noreply@priyanshu.dev";
        private boolean logOnly = true;

        public String getToEmail() {
            return toEmail;
        }

        public void setToEmail(String toEmail) {
            this.toEmail = toEmail;
        }

        public String getFromEmail() {
            return fromEmail;
        }

        public void setFromEmail(String fromEmail) {
            this.fromEmail = fromEmail;
        }

        public boolean isLogOnly() {
            return logOnly;
        }

        public void setLogOnly(boolean logOnly) {
            this.logOnly = logOnly;
        }
    }

    public static class Lab {
        private Seed seed = new Seed();

        public Seed getSeed() {
            return seed;
        }

        public void setSeed(Seed seed) {
            this.seed = seed;
        }

        public static class Seed {
            private boolean enabled = false;
            private int ordersCount = 200000;

            public boolean isEnabled() {
                return enabled;
            }

            public void setEnabled(boolean enabled) {
                this.enabled = enabled;
            }

            public int getOrdersCount() {
                return ordersCount;
            }

            public void setOrdersCount(int ordersCount) {
                this.ordersCount = ordersCount;
            }
        }
    }
}
