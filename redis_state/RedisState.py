import json
import redis
from .RedisProxy import RedisProxy, RedisListProxy

class RedisState:
    def __init__(self, host='localhost', port=6379, db=0, namespace='state'):
        self._client = redis.Redis(host=host, port=port, db=db, decode_responses=True)
        self._namespace = namespace

    def _full_key(self, key):
        return f"{self._namespace}:{key}"

    def _publish_change(self, change_type, key, value=None):
        msg = {
            "type": change_type,
            "key": key
        }
        if value is not None:
            msg["value"] = value
        self._client.publish('redis_changes', json.dumps(msg))

    def __getitem__(self, key):
        full_key = self._full_key(key)
        data = self._client.get(full_key)
        if data is None:
            raise KeyError(key)
        deserialized = json.loads(data)
        if isinstance(deserialized, dict):
            return RedisProxy(deserialized, self._client, full_key, self._publish_change, key)
        elif isinstance(deserialized, list):
            return RedisListProxy(deserialized, self._client, full_key, self._publish_change, key)
        else:
            return deserialized

    def __setitem__(self, key, value):
        full_key = self._full_key(key)
        serialized = json.dumps(value)
        self._client.set(full_key, serialized)
        self._publish_change('update', key, value)

    def __delitem__(self, key):
        full_key = self._full_key(key)
        if not self._client.delete(full_key):
            raise KeyError(key)
        self._publish_change('delete', key)

        
