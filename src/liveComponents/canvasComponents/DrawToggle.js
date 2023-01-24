import React from 'react'
import Button from '@mui/material/Button';
import CreateIcon from '@mui/icons-material/Create';
import CropRotateIcon from '@mui/icons-material/CropRotate';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';




const DrawToggle = ({canvas, setShow, setdrawmodeonoff}) => {
  const [buttonState, setButtonState] = React.useState(false);

  const drawmode = () => {
      if (canvas.isDrawingMode === true){
        canvas.isDrawingMode = false
        setShow(false)
        setdrawmodeonoff(true)
        setButtonState(false)
      }
      else {
        canvas.isDrawingMode = true
        setShow(true)
        setdrawmodeonoff(false)
        setButtonState(true)
      }
    }
  return (
    <>

    <Button 
          key="on/off(draw)"
          type='button' 
          className="navBtn"
          name='on/off(draw)' 
          onClick={drawmode}> 
          {
            buttonState ? 
              <><CreateIcon/> </> 
              : <>  <CropRotateIcon/></> 
          }
    </Button>
    
    </>
  )
}

export default DrawToggle