package com.x.pelegant.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Configuration
@Slf4j
public class MongoConfig extends AbstractMongoClientConfiguration {

    @Override
    protected String getDatabaseName() {
        return "Pelegant";
    }

    // 重写customConversions，注册自定义转换器
    @Override
    @Bean
    public MongoCustomConversions customConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();
        converters.add(new StringToLocalDateTimeConverter());
        return new MongoCustomConversions(converters);
    }

    // 重写mappingMongoConverter，注入依赖，且移除_class字段，注册自定义转换器

    @Bean
    public MappingMongoConverter mappingMongoConverter(MongoDatabaseFactory mongoDatabaseFactory,
                                                       MongoMappingContext mongoMappingContext) throws Exception {
        MappingMongoConverter converter = new MappingMongoConverter(mongoDatabaseFactory, mongoMappingContext);
        converter.setTypeMapper(new DefaultMongoTypeMapper(null)); // 移除_class
        converter.setCustomConversions(customConversions());
        converter.afterPropertiesSet();
        log.info("MongoDB转换器配置完成，移除_class字段，注册自定义转换器");
        return converter;
    }

    // mongoTemplate注入mappingMongoConverter和mongoDbFactory
    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory mongoDatabaseFactory,
                                       MappingMongoConverter mappingMongoConverter) {
        return new MongoTemplate(mongoDatabaseFactory, mappingMongoConverter);
    }

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> Optional.of("system");
    }

    // 自定义字符串转LocalDateTime转换器，支持毫秒格式
    private static class StringToLocalDateTimeConverter implements Converter<String, LocalDateTime> {
        private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");


        @Override
        public LocalDateTime convert(String source) {
            if (source == null) return null;
            try {
                return LocalDateTime.parse(source, FORMATTER);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("无法解析日期字符串: " + source, e);
            }
        }
    }
}
