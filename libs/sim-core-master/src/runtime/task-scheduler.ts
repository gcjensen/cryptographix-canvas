export type Task = () => void;
export type FlushFunc = () => void;
var window = window || {};

export class TaskScheduler
{
  static makeRequestFlushFromMutationObserver(flush): FlushFunc
  {
    var toggle = 1;

    var observer = new TaskScheduler.BrowserMutationObserver(flush);

    var node: Object = document.createTextNode('');

    observer.observe(node, { characterData: true });

    return function requestFlush()
    {
      toggle = -toggle;
      node["data"] = toggle;
    };
  }

  static makeRequestFlushFromTimer(flush): FlushFunc
  {
    return function requestFlush() {
      var timeoutHandle = setTimeout(handleFlushTimer, 0);

      var intervalHandle = setInterval(handleFlushTimer, 50);
      function handleFlushTimer()
      {
        clearTimeout(timeoutHandle);
        clearInterval(intervalHandle);
        flush();
      }
    };
  }

  static BrowserMutationObserver = window[ "MutationObserver" ] || window[ "WebKitMutationObserver"];
  static hasSetImmediate = typeof setImmediate === 'function';

  static taskQueueCapacity = 1024;
  taskQueue: Task[];

  requestFlushTaskQueue: FlushFunc;

  constructor()
  {
    this.taskQueue = [];

    var self = this;

    if (typeof TaskScheduler.BrowserMutationObserver === 'function')
    {
      this.requestFlushTaskQueue = TaskScheduler.makeRequestFlushFromMutationObserver(function () {
        return self.flushTaskQueue();
      });
    }
    else
    {
      this.requestFlushTaskQueue = TaskScheduler.makeRequestFlushFromTimer(function () {
        return self.flushTaskQueue();
      });
    }
  }

  /**
  * Cleanup the TaskScheduler, cancelling any pending communications.
  */
  shutdown()
  {
  }

  queueTask( task)
  {
    if ( this.taskQueue.length < 1 )
    {
      this.requestFlushTaskQueue();
    }

    this.taskQueue.push(task);
  }

  flushTaskQueue()
  {
    var queue = this.taskQueue,
        capacity = TaskScheduler.taskQueueCapacity,
        index = 0,
        task;

    while (index < queue.length)
    {
      task = queue[index];

      try
      {
        task.call();
      }
      catch (error)
      {
        this.onError(error, task);
      }

      index++;

      if (index > capacity)
      {
        for (var scan = 0; scan < index; scan++)
        {
          queue[scan] = queue[scan + index];
        }

        queue.length -= index;
        index = 0;
      }
    }

    queue.length = 0;
  }

  onError(error, task)
  {
    if ('onError' in task) {
      task.onError(error);
    }
    else if ( TaskScheduler.hasSetImmediate )
    {
      setImmediate(function () {
        throw error;
      });
    }
    else
    {
      setTimeout(function () {
        throw error;
      }, 0);
    }
  }
}
