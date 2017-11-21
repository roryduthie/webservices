var app = app || {};

/**
 * BrowseBox
 * ---------------------------------
 * the UI for 'browseBox'
 */

app.BrowseBoxView = Backbone.View.extend({
  el: '#browse_box',

  events: {
    'click #new_analysis': 'newWorkBox',

    'click #importFromFile': 'selectFile',
    'change #myFile': 'importFromFile',

    'click .btn-view': 'viewAnalysis',
    'click .btn-checkout': 'viewAnalysis',

    'click .btn-export': 'exportToFile',
  },

  initialize: function() {

    // Gets the list of analysis from the server
    this.getAnalysisList();

    $("#row-browsebox").show();
  },

  render: function() {},

  newWorkBox: function() {
    // app.workBoxView.clearWorkBox();

    var graphID = generateUUID();

    $("#graph_info .modal-header span").text(graphID);

    $("#graph_info .modal-body input").val("");
    $("#graph_info .modal-body textarea").val("");

    $("#graph_info .modal-footer .btn-create").text("Create").on("click", function(event) {

      var title = $("#graph_info .modal-body input").val();
      var description = $("#graph_info .modal-body textarea").val();

      if (_.isEmpty(title)) {
        alert("Please, enter a title");
      } else {
        var object = {
          "graphID": graphID,
          "userID": readCookie('user_id'),
          "timest": generateDate(),
          "title": title.trim(),
          "description": description.trim(),
          "isshared": false,
          "parentgraphid": null
        };

        Backbone.ajax({
          type: 'POST',
          url: remote_server + '/VC/rest/new',
          //dataType: 'text',
          contentType: 'application/json', //Supply the JWT auth token
          data: JSON.stringify(object),
          success: function(result) {

            $("#row-workbox").show();

            app.workBoxView.clearWorkBox();

            var ret_graph = draw([], [], chart);
            push_graph_data(ret_graph);

            $("#saveProgress").attr("disabled", true);

            // saves the meta data of the graph
            chart.graphID = graphID;
            chart.title = object.title;
            chart.desciption = object.description;
            chart.date = object.timest;
            $("#span-graphTitle").text("[" + chart.title + "]");

            $("#row-browsebox").hide();
            app.toolBoxView.$el.show();

            app.browseBoxView.toggleViewMode(false);

            $("#graph_info").modal('hide');
          },
          error: function(xhr) {
            console.error("Ajax failed: " + xhr.statusText);
            alert('Something went wrong. Please try again.');
          }
        });
      }
    });

    $("#graph_info").modal('show');
  },

  getAnalysisList: function(data) {
    var userID = readCookie('user_id');
    var self = this;

    Backbone.ajax({
      type: 'GET',
      url: remote_server + '/VC/rest/analyses/user/' + userID + '/meta',
      success: function(data) {
        $(".existing-analysis").remove();
        data.forEach(function(analysis) {
          self.makeGraphElement(analysis);
        });
      },
      error: function(xhr) {
        console.error("Ajax failed: " + xhr.statusText);
      }
    });
  },

  makeGraphElement: function(analysis) {
    var div_panel = $("<div></div>", {
      'class': "panel panel-green"
    }).appendTo($("<div></div>", {
      'class': "existing-analysis col-lg-2 col-md-4"
    }).appendTo($("#browse_box")));

    var div_heading = $("<div></div>", {
      'class': "panel-heading"
    }).appendTo(div_panel);

    /*
    $("<label></label>", {
      'text': "graphID",
      'style': "margin: 5px 10px"
    }).appendTo($("<div></div>", {
      'class': "row"
    }).appendTo(div_heading)).after($("<span></span>", {
      'text': analysis.graphID
    }));
    */

    $("<label></label>", {
      'text': "title",
      'style': "margin: 5px 10px"
    }).appendTo($("<div></div>", {
      'class': "row"
    }).appendTo(div_heading)).after($("<span></span>", {
      'text': analysis.title
    }));

    $("<label></label>", {
      'text': "description",
      'style': "margin: 5px 10px"
    }).appendTo($("<div></div>", {
      'class': "row"
    }).appendTo(div_heading)).after($("<span></span>", {
      'text': analysis.description
    }));

    $("<label></label>", {
      'text': "date",
      'style': "margin: 5px 10px"
    }).appendTo($("<div></div>", {
      'class': "row"
    }).appendTo(div_heading)).after($("<span></span>", {
      'text': analysis.timest
    }));

    var btn = $("<button></button>", {
      'class': "pull-right btn btn-outline btn-success btn-export",
      'name': "btn_" + analysis.graphID,
      'text': "Export"
    }).appendTo($("<div></div>", {
      'class': "panel-footer"
    }).appendTo(div_panel)).before($("<button></button>", {
      'class': "pull-left btn btn-outline btn-success btn-view",
      'name': "btn_" + analysis.graphID,
      'text': "View"
    })).before($("<button></button>", {
      'class': "pull-left btn btn-outline btn-success btn-checkout",
      'style': "margin-left: 5px",
      'name': "btn_" + analysis.graphID,
      'text': "Checkout"
    })).after($("<div></div>", {
      'class': "clearfix"
    }));
  },

  toggleViewMode: function(_view_flag) {

    view_flag = _view_flag;

    if (view_flag) {
      // If a user click [View] button, the user should not be able to edit the graph
      $("#info").hide();
      $("#claim").hide();
      $("#pref").hide();
      $("#con").hide();
      $("#pro").hide();

      $("#delete-node").addClass("disabled");
      $("#link-from").addClass("disabled");
      $("#link-to").addClass("disabled");
      $("#cancel-link").addClass("disabled");

      $("#commitGraph").hide();
      $("#checkoutGraph").show();

      $("#span-viewMode").text("(View Only)");
    } else {
      $("#info").show();
      $("#claim").show();
      $("#pref").show();
      $("#con").show();
      $("#pro").show();

      $("#delete-node").removeClass("disabled");
      $("#link-from").removeClass("disabled");
      $("#cancel-link").removeClass("disabled");

      $("#commitGraph").show();
      $("#checkoutGraph").hide();

      $("#span-viewMode").text("");
    }
  },

  viewAnalysis: function(event) {

    var graphID = event.target.attributes.name.value.replace("btn_", "");

    this.toggleViewMode((event.target.attributes.class.value.indexOf("view") > 0));

    Backbone.ajax({
      type: 'GET',
      url: remote_server + '/VC/rest/analysis/' + graphID,
      success: function(data) {

        // validates the json data
        // var result = validateFile(data);
        var result = "success";
        if (result == 'success') {
          // initialises a workbox
          $("#row-workbox").show();
          $("#row-browsebox").hide();
          app.toolBoxView.$el.show();

          app.workBoxView.clearWorkBox();

          // saves the meta data of the graph
          chart.graphID = data['graphID'];
          chart.title = data['title'];
          chart.desciption = data['description'];
          chart.date = data['timest'];

          var nodes = data['nodes'];
          var edges = data['edges'];

          // set up simulations for force-directed graphs
          var ret_simulation = set_simulation(15, chart.svg.width, chart.svg.height);
          push_node_style_data(ret_simulation);

          // the simulation used when drawing a force-directed graph
          chart.simulation = ret_simulation.simulation;

          var ret_graph = draw(nodes, edges, chart);
          push_graph_data(ret_graph);

          // start simulation for displaying graphsv
          chart.simulation = restart_simulation(chart.simulation, false);

          $("#saveProgress").attr("disabled", true);

          $("#span-graphTitle").text("[" + chart.title + "]");
        } else {
          alert(result);
          return ("Fail");
        }
      },
      error: function(xhr) {
        console.error("Ajax failed: " + xhr.statusText);
        alert('An error occurred fetching data.');
      }
    });
  },

  selectFile: function() {

    // app.workBoxView.clearWorkBox();

    var input_file = $("#myFile").click();

    return input_file;
  },

  importFromFile: function(event) {
    readFile(event.target.files, function(jsonData) {
      var graphID = jsonData['graphID'];
      var userID = readCookie('user_id');

      if (_.isEmpty(graphID)) {
        alert("There is no id for this graph in a file");
        return null;
      }

      // 1. Check this graph belongs to the user or not
      Backbone.ajax({
        type: 'GET',
        url: remote_server + "/VC/rest/analyses/user/" + userID + "/meta",
        success: function(data) {
          if (data) {
            var existing = data.find(function(d) {
              return d.graphID == graphID;
            });

            if (existing) {
              alert("A graph exists with this id.");
              return null;
            }
          }
        },
        error: function(xhr) {
          console.error(xhr);
          alert("An error occurred fetching data");
        }
      });

      // 2. Check this graph is saved in database
      Backbone.ajax({
        type: 'GET',
        url: remote_server + "/VC/rest/analysis/" + graphID + "/meta",
        success: function(data) {
          if (data) {
            alert("A graph exists with this id in database.");
            return null;
          }
        },
        error: function(xhr) {
          console.log(xhr);
        },
        complete: function(xhr) {
          if (xhr.status == 404) {
            // 3. Registers a new graph using jsonData
            var title = jsonData['title'];
            var description = jsonData['description'];

            var object = {
              "graphID": graphID,
              "userID": userID,
              "timest": generateDate(),
              "title": title.trim(),
              "description": description.trim(),
              "isshared": false,
              "parentgraphid": null
            };

            Backbone.ajax({
              type: 'POST',
              url: remote_server + '/VC/rest/new',
              contentType: 'application/json',
              data: JSON.stringify(object),
              success: function(result) {

                // 4. The graph is drawn in hidden workBox
                // initialises a workbox
                $("#row-workbox").show();

                app.workBoxView.clearWorkBox();

                $("#row-workbox").hide();

                // saves the meta data of the graph
                var nodes = jsonData['nodes'];
                var edges = jsonData['edges'];

                var ret_graph = draw(nodes, edges, chart);
                push_graph_data(ret_graph);
              },
              error: function(xhr) {
                console.error("Ajax failed: " + xhr.statusText);
                alert('Something went wrong. Please try again.');
              }
            });

            // 5. Saves the graph in database
            var object = {
              "graphID": graphID,
              "userID": userID,
              "title": title.trim(),
              "description": description.trim()
            };

            Backbone.ajax({
              type: 'POST',
              url: remote_server + '/VC/rest/save',
              //dataType: 'text',
              contentType: 'application/json',
              data: JSON.stringify(object),
              success: function(result) {
                alert("Version " + title + " saved.");

                $("#graph_info").modal('hide');
              },
              error: function(result) {
                alert('Something went wrong. Please try again.');
              }
            });

            // 6. Creates a panel in the browsebox
            var analysis = {
              'graphID': graphID,
              'title': title,
              'timest': jsonData['timest'],
              'description': description
            };

            app.browseBoxView.makeGraphElement(analysis);
          }
        }
      });
    });
  },

  exportToFile: function(event) {

    var graphID = event.target.attributes.name.value.replace("btn_", "");

    Backbone.ajax({
      type: 'GET',
      url: remote_server + "/VC/rest/analysis/" + graphID,
      success: function(data) {
        if (data) {
          try {
            var file = new Blob([JSON.stringify(data)], {
              type: 'text/plain'
            });
            event.target.href = URL.createObjectURL(file);
            event.target.download = "export_" + graphID + ".cis";
          } catch (error) {
            console.error(error);
          }
        }
      },
      error: function(xhr) {
        console.error(xhr);
        alert("An error occurred fetching data");
      }
    });
  }
});
