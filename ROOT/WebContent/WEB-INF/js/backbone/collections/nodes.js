/**
 * collection(list of models) for a node which is used in cispaces
 */

var app = app || {};

var NodeList = Backbone.Collection.extend({

  model: app.Node,

  localStorage: new Backbone.LocalStorage('nodes-backbone'),
/*
  url: function() {
      var url = '/api/nodes';
      // if (this.get('nodeID').length > 0) url += '/'+this.get('nodeID');
      return url;
  } 
 */
});

app.Nodes = new NodeList();