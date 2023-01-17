import * as React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import dayjs from 'dayjs';
// import 'dayjs/locale/fr';
// import 'dayjs/locale/ru';
// import 'dayjs/locale/de';
// import 'dayjs/locale/ar-sa';
import Stack from '@mui/material/Stack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import Radio from '@mui/joy/Radio';
import RadioGroup from '@mui/joy/RadioGroup';

import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import Button from '@mui/material/Button';
import axios from 'axios';


export default function CreateClass() {
    //날짜
    let today = new Date()
    console.log(today)
    // const [datePickerValue, setDatePickerValue] = React.useState(dayjs('2021-01-01'));
    const [datePickerValue, setDatePickerValue] = React.useState(dayjs(today));
    const [timePickerValue, setTimePickerValue] = React.useState(dayjs('2021-01-01'));
    const date = datePickerValue.set('hour', timePickerValue.hour())
                            .set('minute', timePickerValue.minute())
                            .set('second', timePickerValue.second());

    const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');


    //라디오 버튼
    const [radio, setRadio] = React.useState(0);
    const handleChange = (event) => {
        setRadio(event.target.value);
    };

    //비밀번호
    const [password, setPassword] = React.useState('');
    const handleChangePassword = (event) => {
        setPassword(event.target.value);
    };


    //교구선택
    const [materials, setMaterial] = React.useState('');
    const handleChangeMaterial = (event) => {
      setMaterial(event.target.value);
    };

    //파일 업로드
    const [files, setFiles] = React.useState([]);
    const inputRef = React.useRef();
    const handleChangeFile = (event) => {
      setFiles(event.target.files[0]);

    };

    //교구선택 데이터 get
    const materialChoice = React.useRef();
    const [materialList, setMaterialList] = React.useState([]); //데이터 받아오기
    const [materiallistId, setMaterialListId] = React.useState([]); //데이터 받아오기
   
    const getMaterialList = async () => {
      const config = {
        method: 'get',
        url: `/api/classMaterial`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        }
      };
      await axios(config)
          .then(response => {
            setMaterialList(response.data.ClassMaterial);
            setMaterialListId(response.data.ClassMaterial);
          }).catch(error => {
            console.error(error);
          }
          );
        };
        
    // const onhandleMaterialList = () => {
    // };
    React.useEffect(() => {
      getMaterialList();
    }, []);
    


    //서브밋
    const onhandlePost = async(data)=>{
      const config = {
        method: 'post',
        url: `/api/class/new`,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `${localStorage.getItem('token')}`
        },
        data: data
      };
      
      await axios(config)
          .then(response => {
              alert('강의가 생성되었습니다.');
              window.location.href = '/class';
              console.log(response);
          }).catch(error => {
              console.error(error);
          }
      );
    };

    

    const handleSubmit = (event) => {
      event.preventDefault();
      const data = new FormData();
      data.append('title', event.target.title.value);
      data.append('startDateTime',formattedDate );
      data.append('classKey',password );
      if (materiallistId[materials]){
        data.append('classMaterial',materiallistId[materials]['id']);
      }else{
        data.append('classMaterial',null);
      }
      data.append('studentMaxNum',radio );
      data.append('image', files);
      
      onhandlePost(data);
    };

  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <React.Fragment>
      <Typography variant="h4" mt={2}>
        라이브 생성
      </Typography>
      <Typography variant="h6" mt={2} style={{marginBottom: '20px', color: '#808080'}}>
        강의를 위한 라이브 방을 생성해 주세요.
      </Typography>
      <Grid container spacing={3} component="form" encType="multipart/form-data" onSubmit={handleSubmit}>
        <Grid item xs={12}>
          <Typography variant="h5" mt={2}>
            강의제목*
          </Typography>
          <TextField
            required
            id="title"
            name="title"
            label="강의 제목을 입력해주세요."
            fullWidth
            autoComplete="given-name"
            variant="standard"
          />
        </Grid>

        {/* 날짜 선택 툴 */}
        <Grid item xs={12}>
            <Stack spacing={3}>
                <Typography variant="h5" mt={2}>
                    날짜선택*
                </Typography>
                <DatePicker
                value={datePickerValue}
                onChange={(newValue) => setDatePickerValue(newValue)}
                renderInput={(params) => <TextField {...params} />}
                />
                <TimePicker
                value={timePickerValue}
                onChange={(newValue) => setTimePickerValue(newValue)}
                renderInput={(params) => <TextField {...params} />}
                />
            </Stack>
        </Grid>

        {/* 입장인원선택 라디오 */}
        <Grid item xs={12}>
            <Typography variant="h5" mt={2}>
                입장인원*
            </Typography>
            <p/>
            <RadioGroup 
                row 
                sx={{ my: 1 }} 
                name="controlled-radio-buttons-group" 
                onChange={handleChange}
                value={radio}
            >
                <Radio
                    color="info"
                    size="md"
                    variant="outlined"
                    label="1명"
                    value={1}
                />
                <Radio
                    color="info"
                    size="md"
                    variant="outlined"
                    label="2명"
                    value={2}
                />
                <Radio
                    color="info"
                    size="md"
                    variant="outlined"
                    label="3명"
                    value={3}
                />
                <Radio
                    color="info"
                    size="md"
                    variant="outlined"
                    label="4명"
                    value={4}
                />
            </RadioGroup>
        </Grid>

        {/* 입장 비밀번호 */}
        <Grid item xs={12}>
          <Typography variant="h5" mt={2}>
            입장비밀번호
          </Typography>
          <TextField
            id="classKey"
            name="classKey"
            label="입장 비밀번호"
            fullWidth
            autoComplete="shipping address-line2"
            variant="standard"
            onChange={handleChangePassword}
          />
        </Grid>

        {/* 교구 선택 */}
        <Grid item xs={12}>
          <Typography variant="h5" mt={2} style={{marginBottom: '20px'}}>
            교구선택
          </Typography>
          
          <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth>
              <InputLabel 
                id="demo-simple-select-label"
                >교구선택</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={materials}
                label="Age"
                // onClick={onhandleMaterialList}
                onChange={handleChangeMaterial}
              >

                {
                  materialList.map((material, index) => {
                    return (
                      <MenuItem 
                        key = {index} 
                        ref={materialChoice} 
                        value={index}>{material.title}
                      </MenuItem>
                    )
                  }
                  )
                }
              </Select>
            </FormControl>
          </Box>
        </Grid>

        {/* 섬네일 이미지 업로드 */}
        <Grid item xs={12}>
          <Typography variant="h5" mt={2}>
            섬네일 이미지 업로드
          </Typography>
          <Stack direction="row" alignItems="center">
          <Button 
            variant="contained" 
            component="label"
            style={{fontSize: '1rem', marginRight: "1em"}}>
            Upload File
            <input hidden accept="image/*" name="image" type="file" ref={inputRef} onChange={handleChangeFile}/>
          </Button>
          <Typography variant="h6" mt={2} style={{color: '#c0c0c0'}}>
            {
              
              files.name ? files.name : '버튼을 눌러 이미지를 업로드해주세요.'
            }
          </Typography>
          
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Stack spacing={2} direction="row">
            <Button 
              variant="outlined" 
              href='/class'
              type='submit'
              fullWidth
              style={{fontSize: '1.2rem'}}
              // sx={{ mt: 3, mb: 2 }}
            >취소</Button>
            <Button 
              // href='/class'
              variant="contained" 
              type='submit'
              fullWidth
              style={{fontSize: '1.2rem'}}
              // sx={{ mt: 3, mb: 2 }}
            >등록</Button>
          </Stack>
        </Grid>
      </Grid>
    </React.Fragment>
    </LocalizationProvider>
  );
}