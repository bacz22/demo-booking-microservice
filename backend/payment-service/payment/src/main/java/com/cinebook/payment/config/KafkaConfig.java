package com.cinebook.payment.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.util.backoff.FixedBackOff;
import tools.jackson.core.JacksonException;

import java.util.Map;

/**
 * Project dùng spring-kafka thuần (không có Boot Kafka auto-config) nên khai báo factory ở đây.
 * Key/value đều là String: payload là JSON envelope do outbox ghi sẵn, consumer tự parse
 * (không có lỗi deserializer làm kẹt partition).
 */
@Configuration
@EnableKafka
public class KafkaConfig {

    @Bean
    ProducerFactory<String, String> producerFactory(@Value("${spring.kafka.bootstrap-servers}") String bootstrapServers) {
        return new DefaultKafkaProducerFactory<>(Map.of(
                ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
                ProducerConfig.ACKS_CONFIG, "all",
                ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true,
                ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class));
    }

    @Bean
    KafkaTemplate<String, String> kafkaTemplate(ProducerFactory<String, String> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    @Bean
    ConsumerFactory<String, String> consumerFactory(@Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
                                                    @Value("${spring.kafka.consumer.group-id}") String groupId) {
        return new DefaultKafkaConsumerFactory<>(Map.of(
                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
                ConsumerConfig.GROUP_ID_CONFIG, groupId,
                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
                ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false,
                ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
                ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class));
    }

    /**
     * Retry 3 lần (cách nhau 1s) rồi đẩy sang topic + ".DLT".
     * Lỗi dữ liệu (JSON hỏng, event không hợp lệ) đẩy thẳng sang DLT, không retry.
     */
    @Bean
    ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
            ConsumerFactory<String, String> consumerFactory, KafkaTemplate<String, String> template,
            @Value("${spring.kafka.listener.auto-startup:true}") boolean autoStartup) {
        var recoverer = new DeadLetterPublishingRecoverer(template,
                (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition()));
        var errorHandler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
        errorHandler.addNotRetryableExceptions(IllegalArgumentException.class, JacksonException.class);

        var factory = new ConcurrentKafkaListenerContainerFactory<String, String>();
        factory.setConsumerFactory(consumerFactory);
        factory.setCommonErrorHandler(errorHandler);
        factory.setAutoStartup(autoStartup);
        return factory;
    }

    /** Bật scheduling cho OutboxPublisher, độc lập với các job khác. */
    @Configuration
    @EnableScheduling
    @ConditionalOnProperty(name = "app.outbox.publisher-enabled", havingValue = "true", matchIfMissing = true)
    static class OutboxSchedulingConfig {
    }
}
