import redis
import json
from typing import Any, List, Dict

class RedisState:
    def __init__(self, host='localhost', port=6379, db=0, namespace='state'):
        self._client = redis.Redis(host=host, port=port, db=db, decode_responses=True)
        self._namespace = namespace

    def _full_key(self, key: str) -> str:
        return f"{self._namespace}:{key}"

    def __getitem__(self, key: str) -> Any:
        value = self._client.get(self._full_key(key))
        if value is None:
            raise KeyError(key)
        return json.loads(value)

    def __setitem__(self, key: str, value: Any) -> None:
        self._client.set(self._full_key(key), json.dumps(value))

    def __delitem__(self, key: str) -> None:
        if not self._client.delete(self._full_key(key)):
            raise KeyError(key)

    def __contains__(self, key: str) -> bool:
        return self._client.exists(self._full_key(key)) > 0

    def keys(self) -> List[str]:
        keys = self._client.keys(f"{self._namespace}:*")
        return [k.split(":", 1)[1] for k in keys]

    def items(self) -> Dict[str, Any]:
        result = {}
        for key in self.keys():
            result[key] = self[key]
        return result

    def values(self) -> List[Any]:
        return list(self.items().values())

    def clear(self) -> None:
        for key in self.keys():
            del self[key]

def __repr__(self) -> str:
    return f"<RedisState namespace='{self._namespace}' keys={self.keys()}>"
    
def __setitem__(self, key: str, value: Any) -> None:
    self._client.set(self._full_key(key), json.dumps(value))
    self._client.publish('redis_changes', f"set:{key}")

def __delitem__(self, key: str) -> None:
    if not self._client.delete(self._full_key(key)):
        raise KeyError(key)
    self._client.publish('redis_changes', f"delete:{key}")
