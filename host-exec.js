module.exports = function(RED) {
  var exec = require('ttbd-exec');
  var isUtf8 = require('is-utf8');
  var Mustache = require('mustache');

  var exec_opt = {
    hydra_exec_host: "mosquitto"
  }

  function hostExec(n) {
    RED.nodes.createNode(this,n);
    this.command = n.command;
    this.name = n.name;
    var node = this;


    this.on("input", function(msg) {
      var command = node.command;
      var availableProperties = ["command","payload"]
      var propertyUsed = null;
      var cloneOfMsg = RED.util.cloneMessage(msg);
      if(!command){
        for( var i in availableProperties){
          if(msg.hasOwnProperty(availableProperties[i]) && msg[availableProperties[i]]){
            propertyUsed = availableProperties[i];
            break;
          }
        }
        if(propertyUsed === null){
          node.warn("Cannot execute an empty payload");
          return;
        }
        command = msg[propertyUsed];
        delete cloneOfMsg[propertyUsed];
      }

      command = Mustache.render(command, cloneOfMsg);
      var notOk = false;
      if(command === ""){
        node.warn("You have nothing to execute, fill the node, msg.command or msg.payload");
        notOk = true;
      }

      if(notOk){
        return;
      }
      exec(command, exec_opt, (err, stdout, stderr) => {
        /**** STDOUT ****/
        if(stdout){
          if (isUtf8(stdout)){
            msg.payload = stdout.toString();
          }
          else {
            msg.payload = stdout;
          }
          node.send([RED.util.cloneMessage(msg),null,null]);
        }

        /**** STDERR ****/
        if(stderr){
          if (isUtf8(stderr)){
            msg.payload = stderr.toString();
          }
          else {
            msg.payload = stderr;
          }
          node.send(null,[RED.util.cloneMessage(msg),null]);
        }

        /****** ERR *****/
        if(err){
          if (isUtf8(err)){
            msg.payload = err.toString();
          }
          else {
            msg.payload = err;
          }
          node.send(null,null,[RED.util.cloneMessage(msg)]);
        }
      })
    })
  }

  RED.nodes.registerType("host exec", hostExec);
}
