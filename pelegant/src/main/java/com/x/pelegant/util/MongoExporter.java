package com.x.pelegant.util;

import com.mongodb.client.*;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class MongoExporter {

    private static final Logger logger = LoggerFactory.getLogger(MongoExporter.class);

    /**
     * 导出指定 MongoDB 数据库的结构与数据到 JSON 文件
     * @param connectionString MongoDB 连接字符串
     * @param databaseName 要导出的数据库名
     * @param outputFile 导出结果的 JSON 文件路径
     */
    public File exportMongoDBStructureAndData(String connectionString, String databaseName, String outputFile) {
        try (MongoClient mongoClient = MongoClients.create(connectionString)) {
            MongoDatabase database = mongoClient.getDatabase(databaseName);

            // 获取所有集合的名称
            List<String> collectionNames = database.listCollectionNames().into(new ArrayList<>());
            StringBuilder jsonContent = new StringBuilder();

            // 遍历每个集合
            for (String collectionName : collectionNames) {
                MongoCollection<Document> collection = database.getCollection(collectionName);
                jsonContent.append(generateCollectionData(collectionName, collection));
            }

            // 将内容写入 JSON 文件，设置 append = false，确保覆盖旧文件
            try (FileWriter fileWriter = new FileWriter(outputFile, false)) {
                fileWriter.write(jsonContent.toString());
            }

            logger.info("数据已成功导出到 " + outputFile);

        } catch (Exception e) {
            logger.error("导出 MongoDB 数据失败", e);
        }
        return new File(outputFile);
    }

    /**
     * 生成集合数据的 JavaScript 格式，每行一个 JSON 对象
     * @param collectionName 集合名称
     * @param collection MongoDB 集合
     * @return JavaScript 格式的字符串
     */
    private static String generateCollectionData(String collectionName, MongoCollection<Document> collection) {
        StringBuilder jsonContent = new StringBuilder();

        // 删除现有集合，并创建新集合
        jsonContent.append("db.getCollection(\"").append(collectionName).append("\").drop();\n");
        jsonContent.append("db.createCollection(\"").append(collectionName).append("\");\n");

        // 获取集合中的所有数据
        List<Document> documents = collection.find().into(new ArrayList<>());
        jsonContent.append("// ----------------------------\n");
        jsonContent.append("// Documents of ").append(collectionName).append("\n");
        jsonContent.append("// ----------------------------\n");

        // 遍历每个文档
        for (Document document : documents) {
            // 将 ObjectId 转换为字符串
            document = convertObjectIdToString(document);
            // 将日期字段转换为指定格式
            document = convertDateToCustomFormat(document);

            // 写入 insert 语句
            jsonContent.append("db.getCollection(\"").append(collectionName).append("\").insert([ ");
            jsonContent.append(document.toJson()).append(" ]);\n");
        }

        return jsonContent.toString();
    }

    /**
     * 将 MongoDB 中的 ObjectId 转换为字符串
     * @param document MongoDB 文档
     * @return 转换后的文档
     */
    private static Document convertObjectIdToString(Document document) {
        for (String key : document.keySet()) {
            Object value = document.get(key);
            if (value instanceof ObjectId) {
                document.put(key, value.toString()); // 将 ObjectId 转为字符串
            } else if (value instanceof Document) {
                convertObjectIdToString((Document) value); // 递归处理子文档
            }
        }
        return document;
    }

    /**
     * 将 MongoDB 中的日期转换为指定格式：yyyy-MM-dd HH:mm:ss.SSS
     * @param document MongoDB 文档
     * @return 转换后的文档
     */
    private static Document convertDateToCustomFormat(Document document) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        for (String key : document.keySet()) {
            Object value = document.get(key);
            if (value instanceof Date) {
                // 将日期转换为指定格式的字符串
                document.put(key, dateFormat.format((Date) value));
            } else if (value instanceof Document) {
                convertDateToCustomFormat((Document) value); // 递归处理子文档
            }
        }
        return document;
    }
}
