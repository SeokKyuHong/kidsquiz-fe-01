import { io } from "socket.io-client";
import socket from "../liveComponents/socketExport";
import * as mediasoupClient from "mediasoup-client";
import _, { random } from "lodash"
import { async } from "q";
import { color } from "@mui/system";

//익스포트 함수
export const getSocket = () => {
  return socket;
};

//멀티 커서 
export const multiCurosr = () =>{
  const hostMultiCursor = document.getElementById("hostMultiCursor");
  const roomName = localStorage.getItem("roomName");

  if(hostMultiCursor.className === 'inactive'){
    hostMultiCursor.innerText = "멀티커서 켜기"
    hostMultiCursor.className = 'active'
    socket.emit('mouseHidden', {roomName});
  
  } else if (hostMultiCursor.className === 'active'){
    hostMultiCursor.innerText = "멀티커서 끄기"
    hostMultiCursor.className = 'inactive'
    socket.emit('mouseShow', {roomName});    
  }
  
}

export const getSocketName = () => {
  const guestNameTemp = localStorage.getItem("guestName");
  return guestNameTemp ? guestNameTemp : "선생";
};

const MediasoupController = () => {
  //비디오 소스 임시로 담아둘 것
  let tempVideoId;
  let guestRoducerId = [];
  let remoteProducerIdPair= {}
  //호스트라면 userName은 호스트 이름, 게스트라면 게스트 이름

  let params = {
    // mediasoup params
    encodings: [
      {
        rid: "r0",
        maxBitrate: 100000,
        scalabilityMode: "S1T3",
      },
      {
        rid: "r1",
        maxBitrate: 300000,
        scalabilityMode: "S1T3",
      },
      {
        rid: "r2",
        maxBitrate: 900000,
        scalabilityMode: "S1T3",
      },
    ],
    codecOptions: {
      videoGoogleStartBitrate: 1000,
    },
  };



  const initCall = async () => {
    //로컬에서 hostName, guestName hostBool을 가져온다.
    const hostName = localStorage.getItem("name");
    const guestName = localStorage.getItem("guestName");
    let hostBool = localStorage.getItem("hostBool");

    let userName = guestName;
    if (hostBool) {
      userName = hostName;
    } else {
      hostBool = false;
    }
    // console.log("userName", userName, "hostBool", hostBool);

    //석규추가
    const hostNameLine = document.getElementById("localUserName");
    hostNameLine.innerHTML = userName;
    //석규추가 끝

    //방이름
    const roomName = localStorage.getItem("roomName");
    let device;
    let rtpCapabilities;
    let producerTransport;
    let consumerTransports = [];
    let audioProducer;
    let videoProducer;
    const videoContainer = document.getElementById("videoContainer");

    //!! [커서]
    socket.on('mouseStart', function (data) {
      if (data.cursorPositionsSaved) { 
        // 같은 방에 존재하는 소켓의 마우스 좌표들이 있는 경우 각 소켓의 좌표를 moveCursorToPosition 함수로 전달
        console.log("✅cursorpositionsSave!!!", data.cursorPositionsSaved);

          // for (let key in data.cursorPositionsSaved) {
          //     console.log('key' + key); //? 왜 undefined? 
          //     moveCursorToPosition(data.cursorPositionsSaved[key], key);
          //   }
        }

        // mousemove 이벤트리스너=> 스로틀을 사용해서 50ms 마다 마우스 움직임을 감지하여 socket으로 데이터 전송
        document.getElementsByClassName("App")[0].addEventListener("mousemove", handleMouseMove);
        let sendMousePosition_throttled = _.throttle(sendMousePosition, 50);
        function handleMouseMove(event) { sendMousePosition_throttled(event); }
    })

    function moveCursorToPosition(data, key, name) {
      console.log("key", key)
      
        let cursorDiv ; 
        //!커서 div 생성 newSocketId
        if (!document.getElementById('mousePosition-' + key)) {
          cursorDiv = document.createElement('div');
          cursorDiv.setAttribute('class', 'mouse')
          cursorDiv.setAttribute('id', 'mousePosition-' +  key);
              
          const cursorImage = document.createElement('div');
          // cursorImage.setAttribute('id','mousImage-' +  key );
          // cursorImage.setAttribute('src', 'https://cdn-icons-png.flaticon.com/512/8000/8000373.png')
          cursorImage.setAttribute('width', '50px')
          cursorImage.setAttribute('height', '50px')
          cursorImage.setAttribute('position', 'absolute')
          cursorImage.setAttribute('top', '0px')
          cursorImage.setAttribute('left', '-30px')
          const color = getRandomColor()
          const svgVariable = `<svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" enable-background="new 0 0 48 48">
          <path fill="${color}" d="M27.8,39.7c-0.1,0-0.2,0-0.4-0.1c-0.2-0.1-0.4-0.3-0.6-0.5l-3.7-8.6l-4.5,4.2C18.5,34.9,18.3,35,18,35 c-0.1,0-0.3,0-0.4-0.1C17.3,34.8,17,34.4,17,34l0-22c0-0.4,0.2-0.8,0.6-0.9C17.7,11,17.9,11,18,11c0.2,0,0.5,0.1,0.7,0.3l16,15 c0.3,0.3,0.4,0.7,0.3,1.1c-0.1,0.4-0.5,0.6-0.9,0.7l-6.3,0.6l3.9,8.5c0.1,0.2,0.1,0.5,0,0.8c-0.1,0.2-0.3,0.5-0.5,0.6l-2.9,1.3 C28.1,39.7,27.9,39.7,27.8,39.7z"/>
          <path fill="#212121" d="M18,12l16,15l-7.7,0.7l4.5,9.8l-2.9,1.3l-4.3-9.9L18,34L18,12 M18,10c-0.3,0-0.5,0.1-0.8,0.2 c-0.7,0.3-1.2,1-1.2,1.8l0,22c0,0.8,0.5,1.5,1.2,1.8C17.5,36,17.8,36,18,36c0.5,0,1-0.2,1.4-0.5l3.4-3.2l3.1,7.3 c0.2,0.5,0.6,0.9,1.1,1.1c0.2,0.1,0.5,0.1,0.7,0.1c0.3,0,0.5-0.1,0.8-0.2l2.9-1.3c0.5-0.2,0.9-0.6,1.1-1.1c0.2-0.5,0.2-1.1,0-1.5 l-3.3-7.2l4.9-0.4c0.8-0.1,1.5-0.6,1.7-1.3c0.3-0.7,0.1-1.6-0.5-2.1l-16-15C19,10.2,18.5,10,18,10L18,10z"/>
      </svg>`
          const svg = `${svgVariable}`
          cursorImage.innerHTML=svg
          cursorImage.className="off"

          const cursorNameSpan = document.createElement('span')
          // cursorNameSpan.setAttribute('id', 'mousePosition-',key )
          cursorNameSpan.setAttribute('class','namefill')
          cursorNameSpan.innerHTML = name
          cursorDiv.appendChild(cursorImage)
          cursorDiv.appendChild(cursorNameSpan)
          //Add to document
          document.getElementsByClassName("App")[0].appendChild(cursorDiv);
        }
        cursorDiv = document.getElementById('mousePosition-' + key)
        cursorDiv.style.left = (data.x - 50) + 'px';
        cursorDiv.style.top = data.y + 'px';
        //cursorDiv.style.left = data.x_pct + 'px';
        //cursorDiv.style.top = data.y_pct + 'px';
        cursorDiv.style.position = 'absolute';
    }

    // 스로틀에 의해 50ms마다 실행되는 콜백함수 -> 마우스 좌표 정보를 서버로 emit 
    function sendMousePosition(event) {
      socket.emit('mousemove', {
          x: event.clientX,
          y: event.clientY,
          x_pct: ((event.layerX / event.view.screen.width) * 100).toFixed(3),
          y_pct: ((event.layerY / event.view.screen.height) * 100).toFixed(3)
      });
    }

      //If a mouse move from socket.io is received, draw it
      socket.on('mousemove', function (data, sid, name) {
        moveCursorToPosition(data, sid, name);
      })

      // 랜덤 색상표  
      function getRandomColor() {
        // const letters = '0123456789ABCDEF';
        // let color = '#';
        // for (let i = 0; i < 6; i++) {
        //   color += letters[Math.floor(Math.random() * 16)];
        // }
        // return color;
        // let color_r = Math.floor(Math.random() * 127 + 128).toString(16);
        // let color_g = Math.floor(Math.random() * 127 + 128).toString(16);
        // let color_b = Math.floor(Math.random() * 127 + 128).toString(16);

        let color = ["#3811F2", "#F512FC", "#E6341B", "#FC9112", "#F2D011", "#F6E72F", "FFFFFF", "FFCCE5","#FE2E9A", '#FF0099', '#FF7A00','#002A95', '#00A0D2' , '#6116FF', '#E32DD1','#0EC4D1', '#1BCC00', '#FF00C3', '#FF3333', '#00C04D', '#00FFF0', '#5A2BBE', '#C967EC', '#46BE2B', '#67EC86', '#F49300', '#FFE600', '#F42900', '#FF9000','#22BC09', '#002B1B', '#9A501B', '#1E0505']
        let randomIndex = Math.floor(Math.random() * color.length);
        return color[randomIndex]
      }
  
                            
    //! 커서 관련 코드 끝! 

    
    //! 1.가장 먼저 실행되는 함수 ( io()로 서버에 소켓 연결이 되면 서버의 emit에 의해 가장 먼저 호출된다. )
    socket.on("connection-success", ({ socketId }) => {
      console.log("🚀🚀🚀🚀🚀 내 소켓 아이디", socket.id)
      getLocalStream();
    });

    // //! 2. 1번에서 호출되어 두번째로 실행되는 함수
    const getLocalStream = () => {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            width: {
              min: 640,
              max: 1920,
            },
            height: {
              min: 400,
              max: 1080,
            },
          },
        })
        .then(streamSuccess)
        .catch((error) => {
          console.log(error.message);
        });
    };

    let audioParams;
    let videoParams = { params };
    let consumingTransports = [];

    let myStream;
    // 성공적으로 미디어를 가져온 경우에 실행됨
    //!3. 2번에서 성공적으로 미디어를 가져오면 실행되는 함수
    const streamSuccess = (stream) => {

      //id가 hostMe인 태그를 가져온다.
      const hostMe = document.getElementById("hostMe"); //추가한거
      const guestMeWrap = document.getElementById("guestMeWrap"); //추가한거
      const guestMe = document.getElementById("guestMe"); //추가한거
      
      myStream = stream;

      const hostName = document.getElementById("hostName"); //추가한거
      const hostCol = document.getElementById("hostCol"); //추가한거

      function myAudioController() {
        if (this.className === "off") {
              const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
              this.innerHTML=svg
              this.className="on"
        }
        else {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>`
          this.innerHTML=svg
          this.className="off"
        }
        stream.getAudioTracks().forEach((track) => {(track.enabled = !track.enabled);}) 
    }  
      function myVideoController() {
        if (this.className === "off") {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2z"/></svg>`
          this.innerHTML=svg
          this.className="on"
        }
        else {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l19.8 19.8M15 15.7V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h.3m5.4 0H13a2 2 0 0 1 2 2v3.3l1 1L22 7v10"/></svg>`
          this.innerHTML=svg
          this.className="off"
        }
        stream.getVideoTracks().forEach((track) => {(track.enabled = !track.enabled);}) 
    }  

      if (hostBool) {
        hostMe.srcObject = stream;

        // 기존의 게스트 창은 안쓴 거니까 visibility none으로 처리 
        guestMeWrap.setAttribute("visibility", "none");
        guestMeWrap.style.display = "none"; 

        hostName.innerText = `${userName} 선생님`;
        const mute = document.getElementById("hostMemute"); //추가한거
        const camera = document.getElementById("hostMecamera"); //추가한거
        mute.addEventListener("click", myAudioController)
        camera.addEventListener("click", myVideoController)
      } else {
        guestMe.srcObject = stream;

        const mute = document.getElementById("guestMemute"); //추가한거
        const camera = document.getElementById("guestMecamera"); //추가한거
        mute.addEventListener("click", myAudioController)
        camera.addEventListener("click", myVideoController)
      }
      //! ... 문법은 audioParams, videoParams의 주소가 아닌 '값'만 가져온다는 의미!
      audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
      videoParams = { track: stream.getVideoTracks()[0], ...videoParams };

      joinRoom();
    };

    //! 4. 3번에서 유저 미디어를 잘 받아서 비디오로 송출한 후에 호출되는 함수. 이 함수를 통해 실제 room에 조인하게 된다.
    const joinRoom = () => {
      socket.emit("joinRoom", roomName, userName, hostBool, (data) => {
        // console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`);
        // we assign to local variable and will be used when loading the client Device (see createDevice above)
        rtpCapabilities = data.rtpCapabilities;
        // once we have rtpCapabilities from the Router, create Device
        createDevice();
      });
    };

    // }
    //! 5. 4번에서 room에 조인하고 router rtpCapabilities를 받아온 후 실행되는 함수. Device 객체를 생성한다.
    const createDevice = async () => {
      try {
        device = new mediasoupClient.Device();

        // Loads the device with RTP capabilities of the Router (server side)
        await device.load({
          // see getRtpCapabilities() below
          routerRtpCapabilities: rtpCapabilities,
        });

        // console.log('Device RTP Capabilities', device.rtpCapabilities)

        // once the device loads, create transport
        createSendTransport();
      } catch (error) {
        console.log(error);
        if (error.name === "UnsupportedError")
          console.warn("browser not supported");
      }
    };

    //! 6. 5번에서 Device 객체를 생성하고나서 호출되느 함수. 비디오를 송출하기 위해 클라이언트 측 SEND Transport 를 생성한다.
    const createSendTransport = () => {
      // see server's socket.on('createWebRtcTransport', sender?, ...)
      // this is a call from Producer, so sender = true
      //! 방에 조인할 때는 아직 다른 producer가 있는지 모르는 상태 -> 우선은 consumer를 false로 한다.
      //! 방에 다른 참여자(producer)가 있다면 그때서야 recv transport를 생성하고 그때  consumer:true가 된다.
      //! 그 작업은 signalNewConsumerTransport 에서 하게 됨 :-)
      socket.emit(
        "createWebRtcTransport",
        { consumer: false },
        ({ params }) => {
          // The server sends back params needed
          // to create Send Transport on the client side
          if (params.error) {
            console.log(params.error);
            return;
          }

          // console.log(params)

          // creates a new WebRTC Transport to send media
          // based on the server's producer transport params

          producerTransport = device.createSendTransport(params);

          // this event is raised when a first call to transport.produce() is made
          // see connectSendTransport() below
          //!! producer client가 SEND Trnasport(LP)의 메서드 produce 메서드를 호출하면 connect 이벤트와 produce 이벤트가 발생됨 
          producerTransport.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                // Signal local DTLS parameters to the server side transport
                // see server's socket.on('transport-connect', ...)
                await socket.emit("transport-connect", {
                  dtlsParameters,
                });

                // Tell the transport that parameters were transmitted.
                //! transport에 parameters들이 전송되었다는 것을 알려주는 역할!
                callback();
              } catch (error) {
                errback(error);
              }
            }
          );
          // producer client가 SEND Trnasport(LP)의 메서드 produce 메서드를 호출하면 connect 이벤트와 produce 이벤트가 발생됨 
          producerTransport.on(
            "produce",
            async (parameters, callback, errback) => {
              // console.log(parameters)
              // console.log("produce 이벤트가 발생하였습니다!", parameters)

              try {
                // tell the server to create a Producer
                // with the following parameters and produce
                // and expect back a server side producer id
                // see server's socket.on('transport-produce', ...)
                await socket.emit(
                  "transport-produce",
                  {
                    kind: parameters.kind,
                    rtpParameters: parameters.rtpParameters,
                    appData: parameters.appData,
                    mysocket: socket.id
                  },
                  ({ id, producersExist }) => {
                    // Tell the transport that parameters were transmitted and provide it with the
                    //! server side producer's id.
                    callback({ id });

                    // if producers exist, then join room
                    if (producersExist) getProducers();
                  }
                );
              } catch (error) {
                errback(error);
              }
            }
          );

          connectSendTransport();
        }
      );
    };

    //! 7. 6번에서 SEND transport를 생성한 후 connect 하기 위해 호출되는 함수
    const connectSendTransport = async () => {
      // we now call produce() to instruct the producer transport
      // to send media to the Router

      // this action will trigger the 'connect' and 'produce' events above
      audioProducer = await producerTransport.produce(audioParams);
      videoProducer = await producerTransport.produce(videoParams);

      audioProducer.on("trackended", () => {
        console.log("audio track ended");

        // close audio track
      });

      audioProducer.on("transportclose", () => {
        console.log("audio transport ended");

        // close audio track
      });

      videoProducer.on("trackended", () => {
        console.log("video track ended");

        // close video track
      });

      videoProducer.on("transportclose", () => {
        console.log("video transport ended");

        // close video track
      });
    };

    //! 8 6번에서 방에 입장했을 때 이미 다른 참여자들이 있는 경우 실행됨
    const getProducers = () => {
      
      socket.emit("getProducers", (producerList) => {
        // for each of the producer create a consumer
        producerList.forEach((id) => {
          signalNewConsumerTransport(id[0], id[1], id[2], id[3]);
        });

        // producerIds.forEach(signalNewConsumerTransport)
      });
    };

    //! 새 참여자 발생시 또는 8번에서 호출됨   1. ** 정해진 순서는 없고, new-producer 이벤트가 발생하면 호출되는 함수
    const signalNewConsumerTransport = async (
      remoteProducerId,
      socketName,
      newSocketId,
      isNewSocketHost
    ) => {
      //check if we are already consuming the remoteProducerId
      if (consumingTransports.includes(remoteProducerId)) return;
      consumingTransports.push(remoteProducerId);

      await socket.emit(
        "createWebRtcTransport",
        { consumer: true },
        ({ params }) => {
          // The server sends back params needed
          // to create Send Transport on the client side
          if (params.error) {
            console.log(params.error);
            return;
          }
          // console.log(`PARAMS... ${params}`)

          let consumerTransport;
          try {
            consumerTransport = device.createRecvTransport(params);
          } catch (error) {
            // exceptions:
            // {InvalidStateError} if not loaded
            // {TypeError} if wrong arguments.
            console.log(error);
            return;
          }

          consumerTransport.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                // Signal local DTLS parameters to the server side transport
                // see server's socket.on('transport-recv-connect', ...)
                await socket.emit("transport-recv-connect", {
                  dtlsParameters,
                  serverConsumerTransportId: params.id,
                });

                // Tell the transport that parameters were transmitted.
                callback();
              } catch (error) {
                // Tell the transport that something was wrong
                errback(error);
              }
            }
          );

          connectRecvTransport(
            consumerTransport,
            remoteProducerId,
            params.id,
            socketName,
            newSocketId,
            isNewSocketHost
          );
        }
      );
    };

    // server informs the client of a new producer just joined
    // 새로운 producer가 있다고 서버가 알려주는 경우!
    socket.on(
      "new-producer",
      ({ producerId, socketName, socketId, isNewSocketHost }) => {
        signalNewConsumerTransport(
          producerId,
          socketName,
          socketId,
          isNewSocketHost
        );
      }
    );

    //!새 참여자 발생시 2. 1번함수에서 호출되는 함수 -> 여기서 실질적으로 새로운 html 요소가 만들어지고 비디오 스트림을 받아옴
    const connectRecvTransport = async (
      consumerTransport,
      remoteProducerId,
      serverConsumerTransportId,
      socketName,
      newSocketId,
      isNewSocketHost
    ) => {
      // for consumer, we need to tell the server first
      // to create a consumer based on the rtpCapabilities and consume
      // if the router can consume, it will send back a set of params as below
      
      // [커서] remoteProducerId와 socketId 관계를 저장해둠 (추후 producer close 시 사용 )
      remoteProducerIdPair.remoteProducerId = newSocketId

      //소켓내임이 있으면 소켓 네임으로 없으면 유저네임
      await socket.emit(
        "consume",
        {
          rtpCapabilities: device.rtpCapabilities,
          remoteProducerId,
          serverConsumerTransportId,
        },
        async ({ params }) => {
          if (params.error) {
            console.log("Cannot Consume");
            return;
          }

          // console.log(`Consumer Params ${params}`)
          // then consume with the local consumer transport
          // which creates a consumer
          const consumer = await consumerTransport.consume({
            id: params.id,
            producerId: params.producerId,
            kind: params.kind,
            rtpParameters: params.rtpParameters,
          });

          consumerTransports = [
            ...consumerTransports,
            {
              consumerTransport,
              serverConsumerTransportId: params.id,
              producerId: remoteProducerId,
              consumer,
            },
        ]
        

        // destructure and retrieve the video track from the producer
        const { track } = consumer
        console.log("새 소켓은 host인가? ", isNewSocketHost)
        
        // console.log("cameraBtn!!", cameraBtn)

          //! 새 소켓이 선생님인 경우 -> 선생님 칸으로 srcObject 넣어주기
          if (isNewSocketHost) {
            // 선생님에게 들어가야해
            const hostMe = document.getElementById("hostMe"); //추가한거
            const hostName = document.getElementById("hostName"); //추가한거
            const hostMeAudio = document.getElementById("hostMeAudio"); //추가한거
            const hostMultiCursor = document.getElementById("hostMultiCursor");
            if (track.kind === "audio") {
              hostMeAudio.srcObject = new MediaStream([track]);
            }
            else {
              hostMe.srcObject = new MediaStream([track]);
            }
            hostName.innerText = `${socketName} 선생님`;

            // hostMultiCursor.addEventListener('click', async(e) =>{
            //   let cursorStatus = hostMultiCursor.className
            //   console.log('클릭 이벤트가 해당합니다!')
            // })

            
          }
          //! 그렇지 않은 경우 학생 요소로 넣어주기!
          else {
            // create a new div element for the new consumer media
            // console.log("params.kind 는 ", params.kind, "remoteProducerId는 ", remoteProducerId)

            if (params.kind === "audio") {
              //! 항상 오디오 요청이 먼저 들어옴. 따라서 모든 새 태그는 오디오일 때만 만들고, 비디오일때는 오디오에서 생성한 것을 찾아서 사용한다. 
              const wrapper = document.createElement("div"); //상위 div (이 안에 오디오, 비디오, micAndVid div 까지 들어가게 될 것)
              wrapper.setAttribute("id", `td-${remoteProducerId}`);
              wrapper.setAttribute("class", newSocketId);
            
              const audio = document.createElement("audio") //! 오디오 태그 생성하고, 속성 설정한 후 srcObject에 스트림 넣어준다
              // const video = document.createElement("video") //???
              // video.srcObject = new MediaStream([track]) //???

              // audio.setAttribute("id", remoteProducerId) //? 굳이 필요 없을듯???
              audio.setAttribute("autoplay", "true")
              wrapper.appendChild(audio)
              
              audio.srcObject = new MediaStream([track])
              videoContainer.appendChild(wrapper)

              // wrapper.innerHTML =
              //   '<audio id="' + remoteProducerId + '" autoplay></audio>';
            } else {
              const existingWrapper = document.getElementsByClassName(newSocketId)[0]
              const video = document.createElement("video")
              // const video = existingWrapper.getElementsByTagName("video") //???
              
              video.setAttribute("id", remoteProducerId) 
              video.setAttribute("autoplay", "true")
              existingWrapper.appendChild(video)
              video.srcObject = new MediaStream([track])

              const newElem = document.createElement("div"); // 비디오, 오디오 화면
              newElem.setAttribute("class", "controllers")
              newElem.innerHTML =
              '<div class="micAndVid"> <p class="guestNameDisplay">"' +  socketName +
               '"</p> <button id="' + newSocketId + '-mute" class="off"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg></button><button id="' 
               + newSocketId + '-camera" class="off"> <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l19.8 19.8M15 15.7V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h.3m5.4 0H13a2 2 0 0 1 2 2v3.3l1 1L22 7v10"/></svg></button></div></div> '
               existingWrapper.appendChild(newElem)
            // }

            // document.getElementById(remoteProducerId).srcObject = new MediaStream([track])
            
            //!버튼 이벤트리스너
            let muteBtn = document.getElementById(newSocketId+'-mute')
            let cameraBtn = document.getElementById(newSocketId+'-camera')
            // let hostMultiCursorBtn = document.getElementById()
            
            if (cameraBtn){
                cameraBtn.addEventListener('click', async (e) => {
                  let camCheck = cameraBtn.className
                  if (camCheck === 'off') {
                      cameraBtn.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2z"/></svg>`
                      cameraBtn.setAttribute("class", "on")
                      
                      let tempSocket = e.target.id.replace('-camera', '');//e.srcElement.id 뒤에 camera 택스트 제거
                      socket.emit("video-out",{
                          studentSocketId: tempSocket,
                          on : false,
                      })
                      // console.log("socket event video-out 완료 ")

                      
                  } else {
                    cameraBtn.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l19.8 19.8M15 15.7V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h.3m5.4 0H13a2 2 0 0 1 2 2v3.3l1 1L22 7v10"/></svg>`
                    cameraBtn.setAttribute("class", "off")
                      //e.srcElement.id 뒤에 camera 택스트 제거
                      let tempSocket = e.target.id.replace('-camera', '');
                      socket.emit("video-out",{
                          studentSocketId: tempSocket,
                          on : true,
                      })
                  }
                })
            }

            if (muteBtn){
              muteBtn.addEventListener('click', async (e) => {
                  console.log("mute 버튼 클릭했어요!!!! 현재 상태는 : ", muteBtn.className)
                  if (muteBtn.className === 'off') {
                      // 소리를 꺼야해! 
                      muteBtn.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
                      muteBtn.setAttribute("class", "on")
                      
                      //e.srcElement.id 뒤에 camera 택스트 제거
                      let tempSocket = e.target.id.replace('-mute', '');
                      //console.log("조용히 시킬 소켓: ", tempSocket)
                      socket.emit('audio-out',{
                          studentSocketId: tempSocket,
                          on : false,
                      })
                      
                  } else {
                      muteBtn.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>`
                      muteBtn.setAttribute("class", "off")
                    //e.srcElement.id 뒤에 camera 택스트 제거
                    let tempSocket = e.target.id.replace("-mute", "");
                    //console.log("다시 말하게 해줄 소켓: ", tempSocket)
  
                    socket.emit("audio-out", {
                      studentSocketId: tempSocket,
                      on: true,
                    });
                  }
              })
          }
            // document.getElementById(remoteProducerId).srcObject = new MediaStream([track])
            }
      } 

        await socket.on('student-video-controller', ( on ) => {
            myStream
            .getVideoTracks()
            .forEach((track) => {
                (track.enabled = on.on);                    
            }); 
            console.log("현재 비디오 상태: ", on)
            // 카메라 화면 요소를 키고 끄기 
        })

        await socket.on('student-audio-controller', ( on ) => {
          console.log(socket.id, " 마이크 ", on.on ," 하겠습니다. ")
            myStream
            .getAudioTracks()
            .forEach((track) => {
                (track.enabled = on.on);                    
            }); 
            console.log("현재 오디오 상태: ", on)
            // 마이크 화면 요소를 키고 끄기 
        })
        
        // the server consumer started with media paused
        // so we need to inform the server to resume
        socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId })
        })
    }


    //🐭 : 마우스 숨기기!
    socket.on("studentMouseHidden", () => {
      const mousePosition = document.getElementsByClassName('mouse')
      const mouseCursorLength = mousePosition.length
    
      for(let i = 0; i < mouseCursorLength ; i++ ){
        document.getElementById(mousePosition[i].id).style.display = 'none'
      }
    })


    //🐭 : 마우스 보이기
    socket.on("studentMouseShow", () => {
      const mousePosition = document.getElementsByClassName('mouse')
      const mouseCursorLength = mousePosition.length;
      for(let i = 0; i < mouseCursorLength ; i++ ){
        console.log(mousePosition[i].id)
        document.getElementById(mousePosition[i].id).style.display = 'block'
      }
    })

    //! 누군가가 연결 종료될 때 발생 -> 해당 비디오 요소가 제거된다.
    socket.on("producer-closed", ({ remoteProducerId }) => {
      // server notification is received when a producer is closed
      // we need to close the client-side consumer and associated transport
      const producerToClose = consumerTransports.find(
        (transportData) => transportData.producerId === remoteProducerId
      );
      producerToClose.consumerTransport.close();
      producerToClose.consumer.close();

      // remove the consumer transport from the list
      consumerTransports = consumerTransports.filter(
        (transportData) => transportData.producerId !== remoteProducerId
      );
      const socketIdLeaving = remoteProducerIdPair.remoteProducerId
      // remove the video div element
      //todo! 여기 뭔가 수정 필요..
      // videoContainer.removeChild(
      //   document.getElementById(`td-${remoteProducerId}`)
      // );
      
      //! [커서] 마우스 커서 remove 
      console.log('mousePosition-' + socketIdLeaving," 남아있으면 안돼요!")
      document.getElementById('mousePosition-' + socketIdLeaving).remove();
      
      socket.emit("closeCursor", socketIdLeaving)
    });
  };

  return {
    init: () => {
      initCall();
    },
  };
};

export default MediasoupController;