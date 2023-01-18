import './css/Canvas.css';
import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
// import { uuid } from 'uuidv4'
import { v1 as uuid } from 'uuid'
import { emitModify, emitAdd, emitAddP, modifyObj, addObj, addPObj, emitDelete, deleteObj, emitClear, clearObj
  ,emitAddImage, addimageObj, emitUrl } from './socket'
import axios from 'axios'
import ScrollContainer from 'react-indiana-drag-scroll'
import socket from "./socketExport"

//석규
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Quiz from './Quiz'
import Puzzle from './Puzzle'
import DrawToggle from './canvasComponents/DrawToggle';
import NewCanvas from './canvasComponents/NewCanvas';
import Figures from './canvasComponents/Figures';
import Chilgyo from './canvasComponents/Chilgyo';
import Deletes from './canvasComponents/Deletes';
import ImageBundle from './canvasComponents/ImageBundle';
import PuzzleBundle from './canvasComponents/PuzzleBundle';
import PermDataSettingIcon from '@mui/icons-material/PermDataSetting';
import CategoryIcon from '@mui/icons-material/Category';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import Crop32Icon from '@mui/icons-material/Crop32';

// let puzzleurl

function Canvas() {
  const [canvas, setCanvas] = useState('');
  const [widthvalue,setWidthvalue] = useState(1);
  const [colorvalue,setColorvalue] = useState('#000000');
  // const [imageURL,setimageURL] = useState('');
  const [show,setShow] = useState(false);
  const [showimage, setShowimage] = useState(false);
  const [showimagePuzzle, setShowimagePuzzle] = useState(false);
  const [showimagePuzzlediv, setShowimagePuzzlediv] = useState(false);
  const [drawmodeonoff, setdrawmodeonoff] = useState(true);
  const [imagearraydata,setimagearraydata] = useState([])
  const [puzzlearraydata,setpuzzlearraydata] = useState([])
  const [puzzleurl, setpuzzleurl] = useState('')
  

  //석규 도형 묶음 on/off 상태값
  const [showFigureBundle, setShowFigureBundle] = useState(false);

  //석규 이미지 묶음 on/off 함수
  const showFigureBundleHandler = () => {
    if(showFigureBundle === false){
      setShowFigureBundle(true);
    }
    else{
      setShowFigureBundle(false);
    }
  }

const bringimageinhtml = (event) => {
  let url = event.currentTarget.src;
  addImage(url)
  setShowimage(false)
}

const bringimageinhtmlPuzzle = (event) =>{
  setpuzzleurl(event.currentTarget.src);
  emitUrl(event.currentTarget.src);
  setShowimagePuzzlediv(true)
  setShowimagePuzzle(false)
}




////////////////////////////////////////////////API 요청부분/////////////////////////////////////////////////////////

const data = new FormData();
data.append("_id","63c7b57d4424a5f77498335a")


  const bringimage = async()=>{
    const config = {
      method: 'post',
      url: `/api/live/image`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${localStorage.getItem('token')}`
      },
      data : data
    };
    
    await axios(config)
        .then(response => {
            setimagearraydata(response.data.image)
        }).catch(error => {
            console.error(error);
        }
    );
  };


  const data2 = new FormData();
data2.append("_id","63c7b57d4424a5f77498335a")

  const bringpuzzleimage = async()=>{
    const config = {
      method: 'post',
      url: `/api/live/puzzle`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${localStorage.getItem('token')}`
      },
      data : data2
    };
    
    await axios(config)
        .then(response => {
          setpuzzlearraydata(response.data.puzzle);
        }).catch(error => {
            console.error(error);
        }
    );
  };

////////////////////////////////////////////////API 요청부분/////////////////////////////////////////////////////////




  const erasemode = () => {
      canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
      canvas.freeDrawingBrush.width = parseInt(widthvalue)
  }
  const pencilmode = () => {
    canvas.isDrawingMode = true
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = parseInt(widthvalue);
    canvas.freeDrawingBrush.color = colorvalue;
    canvas.renderAll()
  }
  const changeWidth = (e) =>{
    setWidthvalue(e.target.value);
    canvas.freeDrawingBrush.width = parseInt(widthvalue);
  }
  const changeColor = (e) =>{
    setColorvalue(e.target.value);
    canvas.freeDrawingBrush.color = colorvalue;
    canvas.renderAll()
  }
  const initCanvas = () =>
     new fabric.Canvas('canv', {
       isDrawingMode: false,
       height: 1920,
       width: 1080,
     })


  useEffect(() => {
    setCanvas(initCanvas());
  }, []);

  useEffect(() => {
    bringimage()
    bringpuzzleimage()
  }, [])

  useEffect(
    () => {
      if (canvas) {
        canvas.on('object:modified', function (options) {
          if (options.target) {
            const modifiedObj = {
              obj: options.target,
              id: options.target.id,
            }
            emitModify(modifiedObj)

          }
        })

        canvas.on('object:moving', function (options) {
          if (options.target) {
            const modifiedObj = {
              obj: options.target,
              id: options.target.id,
            }
            emitModify(modifiedObj)
          }
        })

        canvas.on('path:created', function (options){
          if (options.path) {
            options.path.set({id: uuid()})
  
            const addedPath = {
              path: options.path,
              id: options.path.id,
            }
            emitAddP(addedPath)

          }
        })
        modifyObj(canvas)
        addObj(canvas)
        deleteObj(canvas)
        clearObj(canvas)
        addPObj(canvas)
        addimageObj(canvas)
      }
    },
    [canvas]
  )


  const addImage = (imageURL)=> {
    let object
    fabric.Image.fromURL(imageURL, function(Image){
      Image.scale(0.4);
      object = Image
      object.set({id: uuid()})
      canvas.add(object);
      emitAddImage({url: imageURL, id: object.id})
      canvas.renderAll()
    })
  }

  socket.on("puzzleStart", function(data) {
    setShowimagePuzzlediv(true)
    setpuzzleurl(data)
  })



  return (
    //!리턴
    <div className='App'>
      <div id="buttonGroup">
        {/* 팬/도형 토글 */}
        <DrawToggle
          canvas={canvas}
          setShow={setShow}
          setdrawmodeonoff={setdrawmodeonoff}
          size ="small"
        ></DrawToggle>

        {/* 리셋 */}
        <NewCanvas
          canvas={canvas}
          emitClear={emitClear}
        ></NewCanvas>
        
        {/* 선택 삭제 */}
        <Deletes
          drawmodeonoff={drawmodeonoff}
          canvas={canvas}
          emitDelete={emitDelete}
        ></Deletes>

        {/* 도형 묶음 */}

          <Button onClick={showFigureBundleHandler}>
            <CategoryIcon/>
          </Button>
          {
              showFigureBundle && <Figures
                canvas={canvas}
                colorvalue={colorvalue}
                emitAdd={emitAdd}
                // drawmodeonoff={drawmodeonoff}
              ></Figures>
            }

              {/* <Figures
                canvas={canvas}
                colorvalue={colorvalue}
                emitAdd={emitAdd}
                drawmodeonoff={drawmodeonoff}
                // uuid = {uuid}
              ></Figures> */}
        
        <PuzzleBundle
          showimagePuzzle={showimagePuzzle}
          setShowimagePuzzle={setShowimagePuzzle}
          setShowimagePuzzlediv={setShowimagePuzzlediv}
        >퍼즐</PuzzleBundle>

        <Chilgyo
          drawmodeonoff={drawmodeonoff}
          emitAdd={emitAdd}
          canvas={canvas}
          ></Chilgyo>

        {!drawmodeonoff &&<Button 
          key="pencil"
          type='button' 
          className="navBtn"
          name='pencil' 
          onClick={pencilmode}><BorderColorIcon/></Button>}

        {!drawmodeonoff &&<Button 
          key="erase"
          type='button' 
          className="navBtn"
          name='eraser' 
          onClick={erasemode}><Crop32Icon/></Button>}  

        <ImageBundle
          showimage={showimage}
          setShowimage={setShowimage}
        ></ImageBundle>

        <PuzzleBundle
          showimagePuzzle={showimagePuzzle}
          setShowimagePuzzle={setShowimagePuzzle}
          setShowimagePuzzlediv={setShowimagePuzzlediv}
        ></PuzzleBundle>
    
       

        <input 
          key="color"
          type='color' 
          className='color' 
          onChange={changeColor}
          defaultValue="#000000" 
          id="drawing-color"></input>

      


      {/* <span className='info'>{widthvalue}</span> */}
      {show && <input type="range" onChange={changeWidth} defaultValue ={widthvalue} min="1" max="150"></input>}


      </div>
      
      {showimage && <div>
        <ScrollContainer className="scroll-container" activationDistance = "10">
            <ul className="list">
        {
        imagearraydata.map((a,i) => {
          return <li className="item" key = {'imageitem'+i}>
          <a className="link" key = {'imagelink'+i} >
              <img className="image" src={a.image} onClick = {bringimageinhtml}></img>
          </a>
      </li>
        })}
        </ul>
        </ScrollContainer>
      </div>}
      
      {showimagePuzzle && <div>
        <ScrollContainer className="scroll-container" activationDistance = "10">
            <ul className="list">
        {
        puzzlearraydata.map((b,i) => {
          return <li className="item"key = {'puzzleitem'+i}>
          <a className="link" key = {'puzzlelink'+i} >
              <img className="image" src={b.image} onClick = {bringimageinhtmlPuzzle}></img>
          </a>
      </li>
        })}
        </ul>
        </ScrollContainer>
      </div>}

      <Quiz></Quiz>
      {showimagePuzzlediv && <Puzzle puzzleurl = {puzzleurl} setpuzzleurl ={setpuzzleurl} ></Puzzle>}
      <div>
        <canvas id="canv" />
      </div>
    </div>
  );
}

export default Canvas;