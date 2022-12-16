# What is it?

This is a zero-dependency and low-footprint library that allows you to pack a set of asynchronous tasks and execute them in a controlled way.  
It allows you to execute those tasks in time-based intervals or in size-based chunks.  

# How do I install it?

You can install it by using the following command:

```bash
npm install async-task-packer
```

# Tests

You can run the tests by using the following command:

```bash
npm test
```

# How does it work?

The library exposes a function that returns a function that you can use to add tasks to the queue.  
The function that is returned by the library accepts a function that returns a promise.  
The library will execute the function that you pass to it and will add the promise that it returns to the queue.  
The library will execute the tasks in the queue according to the configuration that you pass to it.  

# Other Info

# ToDo

- [x] Forcing fullfillment should be a parameter.
- [x] Tests
- [x] Expose onError method.
- [ ] Tests - Better coverage.
- [ ] Analyze how to provide a debouncing mechanism for intervals
- [ ] Add a `README.md` file to your repository
- [ ] Document unref. (https://nodejs.org/api/timers.html#timers_timeout_unref)