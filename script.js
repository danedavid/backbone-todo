/* script file */

// Clear the local storage
//localStorage.clear();

// Create namespace for app
var app = {};

// Model
app.Todo = Backbone.Model.extend({
  defaults: {
    title: '',
    completed: false
  },
  toggle: function () {
    this.save({completed: !this.get("completed")});
  }
});

// Collection
app.TodoList = Backbone.Collection.extend({
  model: app.Todo,
  localStorage: new Store("backbone-local"),
  completed: function () {
    return this.filter( function (todo) {
      return todo.get('completed');
    });
  },
  remaining: function () {
    return this.without.apply( this, this.completed() );
  }
});

app.toDoList = new app.TodoList();

// Views
app.TodoView = Backbone.View.extend({
  tagName: 'li',
  myTemplate: _.template($("#item-template").html()),
  render: function () {
    this.$el.html(this.myTemplate(this.model.toJSON()));
    if( this.model.get('completed') === true ) {
      this.$("label").addClass("strike-through");
    }
    this.input = this.$(".edit");
    return this;
  },
  initialize: function () {
    this.model.on('change', this.render, this);
    this.model.on('destroy', this.remove, this);
    console.log("TodoView initialized with " + this.model.get('title'));
  },
  events: {
    'dblclick label': 'edit',
    'keypress .edit': 'updateOnEnter',
    'blur .edit': 'close',
    'click .toggle': 'markAsDone',
    'click .remove': 'destroy'
  },
  edit: function () {
    this.$el.addClass("editing");
    this.input.focus();
  },
  close: function () {
    var value = this.input.val().trim();
    if(value) {
      this.model.save({title: value});
    }
    this.$el.removeClass("editing");
  },
  updateOnEnter: function (e) {
    if( e.which === 13) {
      this.close();
    }
  },
  markAsDone: function () {
    this.model.toggle();
    app.appView.addAll();     // to update the view as soon as an element is marked as done
  },
  destroy: function () {
    this.model.destroy();
  }
});

app.AppView = Backbone.View.extend({
  el: '#todoapp',
  initialize: function () {
    this.input = this.$("#new-todo");
    app.toDoList.on('add', this.addAll, this);
    app.toDoList.on('reset', this.addAll, this);
    app.toDoList.fetch();       // to load from localStorage
    console.log("AppView initialized");
  },
  events: {
    'keypress #new-todo': 'createTodoOnEnter',
  },
  createTodoOnEnter: function (e) {
    if( e.which !== 13 || !this.input.val().trim() ) {
      return;
    }
    app.toDoList.create(this.newAttributes());
    this.input.val('');     // to clear the input box
  },
  addOne: function (todo) {
    var toDoView = new app.TodoView({model: todo});
    $("#todo-list").append(toDoView.render().el);
  },
  addAll: function () {
    this.$("#todo-list").html('');
    switch (window.filter) {
      case 'pending':
        _.each(app.toDoList.remaining(), this.addOne);
        break;
      case 'completed':
        _.each(app.toDoList.completed(), this.addOne);
        break;
      default:
        app.toDoList.each(this.addOne, this);
        break;
    }
  },
  newAttributes: function () {
    return {
      title: this.input.val().trim(),
      completed: false
    }
  }
});

// Router
app.AppRouter = Backbone.Router.extend({
  routes: {
    '*filter': 'setFilter'
  },
  setFilter: function (params) {
    window.filter = params.trim() || '';
    app.toDoList.trigger('reset');
    console.log("setFilter()");
  }
});

app.appRouter = new app.AppRouter();
Backbone.history.start();
app.appView = new app.AppView();
