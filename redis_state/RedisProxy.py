import wrapt
import json

class RedisProxy(wrapt.ObjectProxy):
    def __init__(self, wrapped, redis_client, redis_key, publish_callback, top_level_key, parent_proxy=None):
        super().__init__(wrapped)
        self._self_redis_client = redis_client
        self._self_redis_key = redis_key
        self._self_parent_proxy = parent_proxy
        self._self_publish_callback = publish_callback
        self._self_top_level_key = top_level_key

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        self._save()

    def __delitem__(self, key):
        super().__delitem__(key)
        self._save()

    def _save(self):
        if self._self_parent_proxy:
            self._self_parent_proxy._save()
        else:
            serialized = json.dumps(self.__wrapped__)
            self._self_redis_client.set(self._self_redis_key, serialized)
            self._self_publish_callback('update', self._self_top_level_key, self.__wrapped__)

    def __getitem__(self, key):
        item = super().__getitem__(key)
        if isinstance(item, dict):
            return RedisProxy(item, self._self_redis_client, self._self_redis_key, self._self_publish_callback, self._self_top_level_key, parent_proxy=self)
        elif isinstance(item, list):
            return RedisListProxy(item, self._self_redis_client, self._self_redis_key, self._self_publish_callback, self._self_top_level_key, parent_proxy=self)
        else:
            return item

class RedisListProxy(wrapt.ObjectProxy):
    def __init__(self, wrapped, redis_client, redis_key, publish_callback, top_level_key, parent_proxy=None):
        super().__init__(wrapped)
        self._self_redis_client = redis_client
        self._self_redis_key = redis_key
        self._self_parent_proxy = parent_proxy
        self._self_publish_callback = publish_callback
        self._self_top_level_key = top_level_key

    def __setitem__(self, index, value):
        super().__setitem__(index, value)
        self._save()

    def __delitem__(self, index):
        super().__delitem__(index)
        self._save()

    def append(self, value):
        super().append(value)
        self._save()

    def _save(self):
        if self._self_parent_proxy:
            self._self_parent_proxy._save()
        else:
            serialized = json.dumps(self.__wrapped__)
            self._self_redis_client.set(self._self_redis_key, serialized)
            self._self_publish_callback('update', self._self_top_level_key, self.__wrapped__)

    def __getitem__(self, index):
        item = super().__getitem__(index)
        if isinstance(item, dict):
            return RedisProxy(item, self._self_redis_client, self._self_redis_key, self._self_publish_callback, self._self_top_level_key, parent_proxy=self)
        elif isinstance(item, list):
            return RedisListProxy(item, self._self_redis_client, self._self_redis_key, self._self_publish_callback, self._self_top_level_key, parent_proxy=self)
        else:
            return item
