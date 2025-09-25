package com.x.pelegant.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContinentCount {
    private String id;   // 对应 _id，也就是 continent
    private long count;
}
