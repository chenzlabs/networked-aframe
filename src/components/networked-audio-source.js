var naf = require('../NafIndex');

AFRAME.registerComponent('networked-audio-source', {
  schema: {
    positional: { default: true }
  },

  init: function () {
    this.listener = null;
    this.stream = null;

    this.setMediaStream = this.setMediaStream.bind(this);
  },

  setMediaStream(newStream) {
    if(!this.sound) {
      this.setupSound();
    }

    if(newStream != this.stream) {
      if(this.stream) {
        this.sound.disconnect();
      }
      this.audioEl.srcObject = newStream;
      if(newStream) {
        var source = this.listener.context.createMediaStreamSource(newStream);
        this.sound.setNodeSource(source);
      }
      this.stream = newStream;
    }
  },

  remove: function () {
    if(!this.sound) return;

    this.el.removeObject3D(this.attrName);
    if(this.stream) {
      this.sound.disconnect();
    }
  },

  setupSound: function () {
    var el = this.el;
    var sceneEl = el.sceneEl;

    if (this.sound) {
      el.removeObject3D('sound');
    }

    if(!sceneEl.audioListener) {
      sceneEl.audioListener = new THREE.AudioListener();
      sceneEl.camera && sceneEl.camera.add(sceneEl.audioListener);
      sceneEl.addEventListener('camera-set-active', function (evt) {
        evt.detail.cameraEl.getObject3D('camera').add(sceneEl.audioListener);
      });

      this.audioEl = document.createElement('audio');
      sceneEl.appendChild(this.audioEl);
      
      // for mobile Chrome (and perhaps others), resume audio on user gesture
      window.addEventListener('touchstart', function() {
        console.log('touchstart, ' + sceneEl.audioListener.context.state);
        sceneEl.audioListener.context.resume();
      });
      window.addEventListener('touchend', function() {
        console.log('touchend, ' + sceneEl.audioListener.context.state);
        sceneEl.audioListener.context.resume();
      });
      window.addEventListener('click', function() {
        console.log('click, ' + sceneEl.audioListener.context.state);
        sceneEl.audioListener.context.resume();
      });
    }
    this.listener = sceneEl.audioListener;

    this.sound = this.data.positional ? new THREE.PositionalAudio(this.listener) : new THREE.Audio(this.listener);
    el.setObject3D(this.attrName, this.sound);
  }

});
