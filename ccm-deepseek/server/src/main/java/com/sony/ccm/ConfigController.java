package com.sony.ccm;

import org.apache.curator.framework.CuratorFramework;
import org.apache.zookeeper.data.Stat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/config")
public class ConfigController {

    @Autowired
    private CuratorFramework curatorFramework;

    @GetMapping("/{project}/{environment}")
    public Map<String, String> getConfig(@PathVariable String project, @PathVariable String environment) throws Exception {
        String path = "/configs/" + project + "/" + environment;
        Map<String, String> config = new HashMap<>();

        if (curatorFramework.checkExists().forPath(path) != null) {
            for (String key : curatorFramework.getChildren().forPath(path)) {
                byte[] value = curatorFramework.getData().forPath(path + "/" + key);
                config.put(key, new String(value, StandardCharsets.UTF_8));
            }
        }
        return config;
    }

    @GetMapping("/{project}/{environment}/{key}")
    public String getConfigValue(@PathVariable String project, @PathVariable String environment, @PathVariable String key) throws Exception {
        String path = "/configs/" + project + "/" + environment + "/" + key;
        Stat stat = curatorFramework.checkExists().forPath(path);
        if (stat != null) {
            byte[] value = curatorFramework.getData().forPath(path);
            return new String(value, StandardCharsets.UTF_8);
        } else {
            throw new RuntimeException("Key not found");
        }
    }

    @PutMapping("/{project}/{environment}/{key}")
    public String updateConfigValue(@PathVariable String project, @PathVariable String environment, @PathVariable String key, @RequestBody String value) throws Exception {
        String path = "/configs/" + project + "/" + environment + "/" + key;
        curatorFramework.create().orSetData().creatingParentsIfNeeded().forPath(path, value.getBytes(StandardCharsets.UTF_8));
        return "Configuration updated successfully";
    }
}