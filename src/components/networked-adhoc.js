var naf = require('../NafIndex');

AFRAME.registerSystem('networked-adhoc', {
  // TODO: move to system
  init: function() {
    var scene = this.el;
    if (scene.schemaListener) { return; }
    scene.schemaListener = true;

    NAF.connection.subscribeToDataChannel('schema',
      function (fromClient, dataType, data) {
        var templateEl = document.createElement('script');
        templateEl.innerHTML = data.templateHTML;
        templateEl.setAttribute('type', 'text/html');
        templateEl.setAttribute('id', data.templateName);
        scene.appendChild(templateEl);
        NAF.schemas.add({
          template: '#' + data.templateName,
          components: data.components});
      });
  }
});


AFRAME.registerComponent('networked-adhoc', {
  schema: {
    networkId: {default: ''},
    components: {default: ''},
  },
  init: function () {
    addNetEntityFromElement(this.el, this.data.networkId, this.data);
  }
});

function addNetEntityFromElement(el, networkId, data) {
  if (!networkId) { networkId = Math.random().toString(36).substring(2, 9); }

  // make an inline data URI template from the given element

  el.flushToDOM(); // assume this is synchronous
  var n = el.cloneNode(true); // make a copy
  [ 'id',
    'camera', 'look-controls', 'wasd-controls',
    // 'position', 'rotation',
    'networked', 'networked-share', 'networked-remote', 'networked-adhoc',
    // 'dynamic-body', 'static-body',
    'quaternion', 'velocity',
  ].forEach(function (name) { n.removeAttribute(name); });

  // with the new 0.3.x code, 
  // inline template won't work, since then one can't specify components;
  // move to strategy of broadcasting schema for specific network entity?
  var templateName = 'template-' + networkId;
  NAF.connection.broadcastDataGuaranteed('schema', {
    networkId: networkId,
    templateName: templateName,
    templateHTML: n.outerHTML,
    components: data.components
  });

  //el.setAttribute('id', 'naf-' + networkId);
  el.setAttribute('networked', {
    template: '#' + templateName,
    showLocalTemplate: false,
    networkId: networkId,
    // this is default now... owner: NAF.clientId // we own it to start
  });

  return el;
}

