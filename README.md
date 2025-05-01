# This is a thing...

no, wait... is 3 things...

## 1. the extension "myextension" (for now)

It's a Jupyter Lab extension.

```shell
    jupyter labextension install .
    jlpm run build
    jlpm run watch
```

## 2. The redis server

Run the Docker

```shell
    docker run -p 6379:6379 -d redis
```

Run the Express server

```shell
    cd redis_server
    node server.js
```

## 3. The redis state module

```python 
    from redis_state import RedisState

    state = RedisState()

    # now you can do:
    state["foo"] = "bar"
    print(state["foo"])
```

TODO:

- [ ] There is a bug with arrays...
```
state['dios'] = [
{
    "soy": "la",
    "objeto": False
},
{
    "soy": "el",
    "objeto": False
}
    
]
#...
state['dios'][0]['soy'] = "Los"
```

https://chatgpt.com/c/67e9f2b7-3574-8000-acc9-d108748bd71f