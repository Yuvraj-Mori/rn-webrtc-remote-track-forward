
# React-Native-Webrtc Remote Audio Track Forward

Facing problem when remote Audio Track Forward to mediasoup/other peers to crach android app




## Run Locally

Clone the project

```bash
  git clone https://github.com/Yuvraj-Mori/rn-webrtc-remote-track-forward.git
```

Go to the project directory

```bash
  cd rn-webrtc-remote-track-forward
```

Install dependencies

```bash
  npm install
```

-> create firebase android app with same package name like com.webrtcremotetrackforward

-> download "google-services.json" file from firebase project and put in "..\project\android\app" directory 

-> create firestore database with "channels" document according screenshot 

<img src="https://github.com/Yuvraj-Mori/rn-webrtc-remote-track-forward/blob/main/doc/shreenshots/firestore%20setup.PNG" />


start project in android
```bash
  npx react-native run-android
```

-> start webcame and assign permissions 

 <img src="https://github.com/Yuvraj-Mori/rn-webrtc-remote-track-forward/blob/main/doc/shreenshots/start-cam.jpg" height=500 />


-> click on "start call" button to generate new ID  

 <img src="https://github.com/Yuvraj-Mori/rn-webrtc-remote-track-forward/blob/main/doc/shreenshots/start-call.jpg" height=500 />

-> new generated id fill in other peer join call text-input and click on "join call" button

-> after other peer join to visible "forward remote audio" button click on button to reproduce problem 

 <img src="https://github.com/Yuvraj-Mori/rn-webrtc-remote-track-forward/blob/main/doc/shreenshots/forward-track.jpg" height=500 />
