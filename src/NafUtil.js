module.exports.whenEntityLoaded = function(entity, callback) {
  if (entity.hasLoaded) { callback(); }
  entity.addEventListener('loaded', function () {
    callback();
  });
}

module.exports.createHtmlNodeFromString = function(str) {
  var div = document.createElement('div');
  div.innerHTML = str;
  var child = div.firstChild;
  return child;
}

module.exports.getNetworkOwner = function(entity) {
  var components = entity.components;
  if (components.hasOwnProperty('networked-remote')) {
    return entity.components['networked-remote'].data.owner;
  } else if (components.hasOwnProperty('networked-share')) {
    return entity.components['networked-share'].data.owner;
  } else if (components.hasOwnProperty('networked')) {
    return entity.components['networked'].owner;
  }
  return null;
}

module.exports.getNetworkId = function(entity) {
  var components = entity.components;
  if (components.hasOwnProperty('networked-remote')) {
    return entity.components['networked-remote'].data.networkId;
  } else if (components.hasOwnProperty('networked-share')) {
    return entity.components['networked'].data.networkId;
  } else if (components.hasOwnProperty('networked')) {
    return entity.components['networked'].networkId;
  }
  return null;
}

module.exports.getNetworkType = function(entity) {
  var components = entity.components;
  if (components.hasOwnProperty('networked-remote')) {
    return "networked-remote";
  } else if (components.hasOwnProperty('networked-share')) {
    return "networked-share";
  } else if (components.hasOwnProperty('networked')) {
    return "networked";
  }
  return null;
}

module.exports.now = function() {
  return Date.now();
};

module.exports.delimiter = '---';

function sanitizeKey(key) {
  return key.replace(/\./g, '!').replace(/\#/g, '@').replace(/\[/g, '{').replace(/\]/g, '}'); 
}

function desanitizeKey(key) {
  return key.replace(/\!/g, '.').replace(/\@/g, '#').replace(/\{/g, '[').replace(/\}/g, ']'); 
}

module.exports.childSchemaToKey = function(schema) {
  return sanitizeKey(schema.selector || '') + module.exports.delimiter + schema.component + module.exports.delimiter + (schema.property || '');
};

module.exports.keyToChildSchema = function(key) {
  var splitKey = key.split(module.exports.delimiter, 3);
  return { selector: desanitizeKey(splitKey[0]) || undefined, component: splitKey[1], property: splitKey[2] || undefined};
};

module.exports.isChildSchemaKey = function(key) {
  return key.indexOf(module.exports.delimiter) != -1;
};

module.exports.childSchemaEqual = function(a, b) {
  return a.selector == b.selector && a.component == b.component && a.property == b.property;
};

module.exports.monkeyPatchEntityFromTemplateChild = function (entity, templateChild, callback) {
  templateChild.addEventListener('templaterendered', function () {
    var cloned = templateChild.firstChild;
    // mirror the attributes
    Array.prototype.slice.call(cloned.attributes || []).forEach(function (attr) {
      entity.setAttribute(attr.nodeName, attr.nodeValue);
    });
    // take the children
    for (var child = cloned.firstChild; child; child = cloned.firstChild) {
      cloned.removeChild(child);
      entity.appendChild(child);
    }

    cloned.pause && cloned.pause();
    templateChild.pause();
    setTimeout(function() {
      try { templateChild.removeChild(cloned); } catch (e) {}
      try { entity.removeChild(templateChild); } catch (e) {}
      if (callback) { callback(); }
    });
  });
};
