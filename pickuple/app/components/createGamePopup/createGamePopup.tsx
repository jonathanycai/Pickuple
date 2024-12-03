import { Autocomplete, Button, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, FormLabel, IconButton, MenuItem, Popper, Radio, RadioGroup, Select, styled, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';
import styles from './createGamePopup.module.css';
import { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { CreateGameInviteForm } from '../../utils/types';
import * as yup from 'yup';
import { createGame } from '../../services/gameServices';
import { getCourts } from '../../services/courtService';
import { useUserContext } from '@/app/GlobalContext';

interface createGamePopupProps {
  open: boolean,
  handleClose: () => void
}

const StyledSelect = styled(Select)<{ value: string }>(() => ({
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "white",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "white",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "white",
  },
  "& .MuiSelect-select": {
    color: "white"
  },
  "& .MuiSelect-icon": {
    color: 'white'
  },
}));

type address = {
  courtNumber: Set<string>,
  postalCode: Set<string>
}
type pcode = {
  courtNumber: Set<string>,
  address: Set<string>
}
type cnum = {
  address: Set<string>,
  postalCode: Set<string>
}
type CourtNumberMapping = Record<string, cnum>
type PostalCodeMapping = Record<string, pcode>
type AddressMapping = Record<string, address>

export function CreateGamePopup({ open, handleClose }: createGamePopupProps) {

  const { userID } = useUserContext();

  const [addresses, setAddresses] = useState<AddressMapping>({});
  const [pCodes, setPCodes] = useState<PostalCodeMapping>({});
  const [cNums, setCNums] = useState<CourtNumberMapping>({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCourts().then((data) => {
      const addressMapping: AddressMapping = {}
      const postalCodeMapping: PostalCodeMapping = {}
      const courtNumberMapping: CourtNumberMapping = {}
      for (const [courtNumber, address, postalCode] of data) {
        if (courtNumber in courtNumberMapping) {
          courtNumberMapping[courtNumber.toString()]['address'].add(address);
          courtNumberMapping[courtNumber.toString()].postalCode.add(postalCode);
        } else {
          courtNumberMapping[courtNumber.toString()] = { address: new Set(), postalCode: new Set() }
          courtNumberMapping[courtNumber.toString()]['address'].add(address);
          courtNumberMapping[courtNumber.toString()].postalCode.add(postalCode);
        }
        if (postalCode in postalCodeMapping) {
          postalCodeMapping[postalCode]['address'].add(address);
          postalCodeMapping[postalCode].courtNumber.add(courtNumber.toString());
        } else {
          postalCodeMapping[postalCode] = { address: new Set(), courtNumber: new Set() }
          postalCodeMapping[postalCode]['address'].add(address);
          postalCodeMapping[postalCode].courtNumber.add(courtNumber.toString());
        }
        if (address in addressMapping) {
          addressMapping[address].postalCode.add(postalCode);
          addressMapping[address].courtNumber.add(courtNumber.toString());
        } else {
          addressMapping[address] = { postalCode: new Set(), courtNumber: new Set() }
          addressMapping[address].postalCode.add(postalCode);
          addressMapping[address].courtNumber.add(courtNumber.toString());
        }
      }
      setAddresses(addressMapping);
      setPCodes(postalCodeMapping);
      setCNums(courtNumberMapping);
    }).catch((err) => {
      console.log(err);
    })
  }, [open])

  const displayAddresses = () => {
    const courtNumber = form.values.location.courtNumber;
    const pCode = form.values.location.postalCode;
    try {
      if (courtNumber && pCode) {
        return [...cNums[courtNumber].address].filter((value) => pCodes[pCode].address.has(value)).map((address) => address);
      } else if (courtNumber) {
        return [...cNums[courtNumber].address].map((address) => address);
      } else if (pCode) {
        return [...pCodes[pCode].address].map((address) => address);
      } else {
        return Object.keys(addresses).map((address) => address);
      }
    } catch {
      return []
    }
  }

  const displayPCodes = () => {
    const address = form.values.location.address;
    const courtNumber = form.values.location.courtNumber;
    try {
      if (address && courtNumber) {
        return [...cNums[courtNumber].postalCode].filter((value) => addresses[address].postalCode.has(value)).map((postalCode) => postalCode);
      } else if (courtNumber) {
        return [...cNums[courtNumber].postalCode].map((postalCode) => postalCode);
      } else if (address) {
        return [...addresses[address].postalCode].map((postalCode) => postalCode);
      } else {
        return Object.keys(pCodes).map((postalCode) => postalCode);
      }
    } catch {
      return []
    }
  }

  const displayCNums = () => {
    const address = form.values.location.address;
    const postalCode = form.values.location.postalCode;
    try {
      if (address && postalCode) {
        return [...pCodes[postalCode].courtNumber].filter((value) => addresses[address].courtNumber.has(value)).map((courtNumber) => courtNumber);
      } else if (postalCode) {
        return [...pCodes[postalCode].courtNumber].map((courtNumber) => courtNumber);
      } else if (address) {
        return [...addresses[address].courtNumber].map((courtNumber) => courtNumber);
      } else {
        return Object.keys(cNums).map((courtNumber) => courtNumber);
      }
    } catch {
      return []
    }
  }

  const schema = useMemo(
    () =>
      yup.object({
        location: yup.object().shape({
          address: yup.string().required(),
          postalCode: yup.string().required(),
          courtNumber: yup.string().matches(/^\d+$/).required(),
        }).required(),
        reservation: yup.object().shape({
          date: yup.object().shape({
            month: yup.string().matches(/^\d+$/).required(),
            day: yup.string().matches(/^\d+$/).required(),
            year: yup.string().matches(/^\d+$/).required(),
          }).required(),
          time: yup.object().shape({
            hour: yup.string().matches(/^\d+$/).required(),
            minute: yup.string().matches(/^\d+$/).required(),
            ampm: yup.string().required(),
          }).required(),
        }).required(),
        game: yup.object().shape({
          capacity: yup.string().matches(/^\d+$/).required(),
          type: yup.string().required(),
        }).required(),
        gameInvite: yup.object().shape({
          title: yup.string().required(),
          description: yup.string().notRequired(),
        }).required(),
        thumbnail: yup.mixed().notRequired(),
      }),
    []
  );

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09',
    '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
    '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
    '30', '31'
  ];
  const hours = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09',
    '10', '11', '12'
  ];
  const minutes = ['00', '15', '30', '45'];

  const form = useFormik<CreateGameInviteForm>({
    initialValues: {
      location: {
        address: '',
        postalCode: '',
        courtNumber: '',
      },
      reservation: {
        date: {
          month: '',
          day: '',
          year: ''
        },
        time: {
          hour: '',
          minute: '',
          ampm: ''
        }
      },
      game: {
        capacity: '',
        type: '',
      },
      gameInvite: {
        title: '',
        description: '',
      },
      thumbnail: null,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      setError('');
      setSuccess(false);
      const formData = new FormData();

      for (const [key, value] of Object.entries(values)) {
        if (key == "reservation") {
          let hour = Number(value.time.hour)
          if (value.date.ampm === "PM") {
            hour += 12;
          }
          console.log(hour);
          const datetime = value.date.year + "-" + value.date.month + "-" + value.date.day + " " + hour + ":" + value.time.minute;
          formData.append(key, datetime);
        } else if (key == "thumbnail") {
          formData.append(key, value);
        } else {
          formData.append(key, JSON.stringify(value));
        }
      }
      formData.append("userID", userID!.toString());

      const result = await createGame(formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    },
  });

  const closeDialog = () => {
    resetForm();
    handleClose();
  }

  const resetForm = () => {
    setError('');
    setSuccess(false);
    form.resetForm();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: form.handleSubmit,
        sx: {
          backgroundColor: 'rgb(18,18,18)',
          color: 'white'
        },
      }}
    >
      <div className='flex flex-row justify-between p-4'>
        <Typography variant='h4' className='p-2 font-bold'>Create New Game</Typography>
        <IconButton onClick={closeDialog}>
          <CloseIcon sx={{ color: 'white' }} />
        </IconButton>
      </div>
      <DialogContent className='gap-4 flex flex-col py-0 px-[26px]'>
        <div className='flex flex-col gap-2'>
          <Typography variant='h5' className='font-bold'>Location</Typography>
          <div className={`${styles.locationInputsGrid}`}>
            <div className='flex flex-col'>
              <p>Address<span style={{ color: 'red' }}> *</span></p>
              <Autocomplete
                freeSolo
                options={displayAddresses()}
                value={form.values.location.address}
                onBlur={() => {
                  const value = form.values.location.address;
                  if (!displayAddresses().includes(value)) {
                    form.setFieldValue("location.address", "");
                  }
                }}
                onChange={(_event, newValue) => {
                  form.setFieldValue("location.address", newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="location.address"
                    value={form.values.location.address}
                    onChange={form.handleChange}
                    InputProps={{
                      ...params.InputProps,
                      classes: {
                        input: styles.inputForm,
                        notchedOutline: styles.inputBorder,
                      },
                    }}
                    size='small'
                  />
                )}
                PopperComponent={(props) => (
                  <Popper {...props} sx={{
                    "& .MuiAutocomplete-paper": {
                      bgcolor: '#2C2C2C',
                      color: 'white',
                    }
                  }} />
                )}
                componentsProps={{
                  clearIndicator: {
                    sx: {
                      color: 'white',
                    }
                  }
                }}
              />
            </div>
            <div className='flex flex-col'>
              <p>Postal Code<span style={{ color: 'red' }}> *</span></p>
              <Autocomplete
                freeSolo
                options={displayPCodes()}
                value={form.values.location.postalCode}
                onBlur={() => {
                  const value = form.values.location.postalCode;
                  if (!displayPCodes().includes(value)) {
                    form.setFieldValue("location.postalCode", "");
                  }
                }}
                onChange={(_event, newValue) => {
                  form.setFieldValue("location.postalCode", newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="location.postalCode"
                    value={form.values.location.postalCode}
                    onChange={form.handleChange}
                    InputProps={{
                      ...params.InputProps,
                      classes: {
                        input: styles.inputForm,
                        notchedOutline: styles.inputBorder,
                      },
                    }}
                    size='small'
                    inputProps={{
                      ...params.inputProps,
                      maxLength: 6
                    }}
                  />
                )}
                PopperComponent={(props) => (
                  <Popper {...props} sx={{
                    "& .MuiAutocomplete-paper": {
                      bgcolor: '#2C2C2C',
                      color: 'white',
                    }
                  }} />
                )}
                componentsProps={{
                  clearIndicator: {
                    sx: {
                      color: 'white',
                    }
                  }
                }}
              />
            </div>
            <div className='flex flex-col'>
              <p>Court #<span style={{ color: 'red' }}> *</span></p>
              <Autocomplete
                freeSolo
                options={displayCNums()}
                value={form.values.location.courtNumber}
                onBlur={() => {
                  const value = form.values.location.courtNumber;
                  if (!displayCNums().includes(value)) {
                    form.setFieldValue("location.courtNumber", "");
                  }
                }}
                onChange={(_event, newValue) => {
                  form.setFieldValue("location.courtNumber", newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="location.courtNumber"
                    value={form.values.location.courtNumber}
                    onChange={form.handleChange}
                    placeholder='##'
                    InputProps={{
                      ...params.InputProps,
                      classes: {
                        input: styles.inputForm,
                        notchedOutline: styles.inputBorder,
                      },
                    }}
                    size='small'
                    inputProps={{
                      ...params.inputProps,
                      maxLength: 2
                    }}
                  />
                )}
                PopperComponent={(props) => (
                  <Popper {...props} sx={{
                    "& .MuiAutocomplete-paper": {
                      bgcolor: '#2C2C2C',
                      color: 'white',
                    }
                  }} />
                )}
                componentsProps={{
                  clearIndicator: {
                    sx: {
                      color: 'white',
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <Typography variant='h5' className='font-bold'>Reservation</Typography>
          <div className={`${styles.reservationGrid}`}>
            <div className='flex flex-col min-w-full'>
              <p>Date<span style={{ color: 'red' }}> *</span></p>
              <div className={styles.reservationSubGrid}>
                <StyledSelect
                  displayEmpty
                  name="reservation.date.month"
                  value={form.values.reservation.date.month}
                  onChange={form.handleChange}
                  renderValue={(value) => {
                    const retVal = value as string
                    if (retVal.length === 0) {
                      return <span className={styles.placeholder}>Month</span>;
                    }
                    return retVal;
                  }}
                  size='small'
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#2C2C2C',
                        color: 'white',
                        maxHeight: '300px',
                        "&::-webkit-scrollbar": {
                          width: '4px',
                        },
                        "&::-webkit-scrollbar-thumb": {
                          width: '2px',
                          backgroundColor: '#5a5a5a',
                          borderRadius: '8px'
                        },
                        "&::-webkit-scrollbar-track": {
                          backgroundColor: '#2C2C2C',
                        },
                      },
                    },
                  }}
                >
                  {months.map((val, key) => (
                    <MenuItem className='bg-inherit' key={val} value={(key + 1) >= 10 ? (key + 1).toString() : '0' + (key + 1).toString()}>{val}</MenuItem>
                  ))}
                </StyledSelect>
                <StyledSelect
                  displayEmpty
                  name="reservation.date.day"
                  value={form.values.reservation.date.day}
                  onChange={form.handleChange}
                  renderValue={(value) => {
                    const retVal = value as string
                    if (retVal.length === 0) {
                      return <span className={styles.placeholder}>Day</span>;
                    }
                    return retVal;
                  }}
                  size='small'
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#2C2C2C',
                        color: 'white',
                        maxHeight: '300px',
                        "&::-webkit-scrollbar": {
                          width: '4px',
                        },
                        "&::-webkit-scrollbar-thumb": {
                          width: '2px',
                          backgroundColor: '#5a5a5a',
                          borderRadius: '8px'
                        },
                        "&::-webkit-scrollbar-track": {
                          backgroundColor: '#2C2C2C',
                        },
                      },
                    },
                  }}
                >
                  {days.map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </StyledSelect>
                <TextField
                  placeholder='Year'
                  name="reservation.date.year"
                  value={form.values.reservation.date.year}
                  onChange={form.handleChange}
                  InputProps={{
                    classes: {
                      input: styles.inputForm,
                      notchedOutline: styles.inputBorder,
                    },
                  }}
                  inputProps={{ maxLength: 4 }}
                  size='small'
                />
              </div>
            </div>
            <div className='flex flex-col min-w-full'>
              <p>Time<span style={{ color: 'red' }}> *</span></p>
              <div className={styles.reservationSubGrid}>
                <StyledSelect
                  displayEmpty
                  name="reservation.time.hour"
                  value={form.values.reservation.time.hour}
                  onChange={form.handleChange}
                  renderValue={(value) => {
                    const retVal = value as string
                    if (retVal.length === 0) {
                      return <span className={styles.placeholder}>Hour</span>;
                    }
                    return retVal;
                  }}
                  size='small'
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#2C2C2C',
                        color: 'white',
                        maxHeight: '300px',
                        "&::-webkit-scrollbar": {
                          width: '4px',
                        },
                        "&::-webkit-scrollbar-thumb": {
                          width: '2px',
                          backgroundColor: '#5a5a5a',
                          borderRadius: '8px'
                        },
                        "&::-webkit-scrollbar-track": {
                          backgroundColor: '#2C2C2C',
                        },
                      },
                    },
                  }}
                >
                  {hours.map((hour) => (
                    <MenuItem key={hour} value={hour}>{hour}</MenuItem>
                  ))}
                </StyledSelect>
                <StyledSelect
                  displayEmpty
                  name="reservation.time.minute"
                  value={form.values.reservation.time.minute}
                  onChange={form.handleChange}
                  renderValue={(value) => {
                    const retVal = value as string
                    if (retVal.length === 0) {
                      return <span className={styles.placeholder}>Min</span>;
                    }
                    return retVal;
                  }}
                  size='small'
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#2C2C2C',
                        color: 'white',
                        maxHeight: '300px',
                        "&::-webkit-scrollbar": {
                          width: '4px',
                        },
                        "&::-webkit-scrollbar-thumb": {
                          width: '2px',
                          backgroundColor: '#5a5a5a',
                          borderRadius: '8px'
                        },
                        "&::-webkit-scrollbar-track": {
                          backgroundColor: '#2C2C2C',
                        },
                      },
                    },
                  }}
                >
                  {minutes.map((min) => (
                    <MenuItem key={min} value={min}>{min}</MenuItem>
                  ))}
                </StyledSelect>
                <StyledSelect
                  displayEmpty
                  name="reservation.time.ampm"
                  value={form.values.reservation.time.ampm}
                  onChange={form.handleChange}
                  renderValue={(value) => {
                    const retVal = value as string
                    if (retVal.length === 0) {
                      return <span className={styles.placeholder}>AM/PM</span>;
                    }
                    return retVal;
                  }}
                  size='small'
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#2C2C2C',
                        color: 'white',
                        maxHeight: '300px',
                        "&::-webkit-scrollbar": {
                          width: '4px',
                        },
                        "&::-webkit-scrollbar-thumb": {
                          width: '2px',
                          backgroundColor: '#5a5a5a',
                          borderRadius: '8px'
                        },
                        "&::-webkit-scrollbar-track": {
                          backgroundColor: '#2C2C2C',
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value={'AM'}>AM</MenuItem>
                  <MenuItem value={'PM'}>PM</MenuItem>
                </StyledSelect>
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <FormControl sx={{ width: '50%' }}>
              <p>Format<span style={{ color: 'red' }}> *</span></p>
              <RadioGroup
                row
                name="row-radio-buttons-group"
                className='gap-8'
                value={form.values.game.type}
                onChange={(_e, newValue) => { form.setFieldValue('game.type', newValue) }}
              >
                <FormControlLabel value="singles" control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }} />} label="Singles" />
                <FormControlLabel value="doubles" control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }} />} label="Doubles" />
              </RadioGroup>
            </FormControl>
            <div className='flex flex-col'>
              <p>Capacity<span style={{ color: 'red' }}> *</span></p>
              <TextField
                name="game.capacity"
                value={form.values.game.capacity}
                onChange={form.handleChange}
                placeholder='##'
                InputProps={{
                  classes: {
                    input: styles.inputForm,
                    notchedOutline: styles.inputBorder,
                  },
                }}
                sx={{ width: '80px' }}
                size='small'
                inputProps={{ maxLength: 2 }}
              />
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <Typography variant='h5' className='font-bold'>Game Invite</Typography>
          <div className={styles.gameInviteGrid}>
            <div className='flex flex-col'>
              <p>Title<span style={{ color: 'red' }}> *</span></p>
              <TextField
                name="gameInvite.title"
                value={form.values.gameInvite.title}
                onChange={form.handleChange}
                InputProps={{
                  classes: {
                    input: styles.inputForm,
                    notchedOutline: styles.inputBorder,
                  },
                }}
                size='small'
              />
            </div>
            <div className='flex flex-col'>
              <p>Thumbnail</p>
              <div className='flex flex-row items-center gap-2 h-full'>
                <input id="file-upload" style={{ display: 'none' }} onChange={(e) => form.setFieldValue('thumbnail', e.currentTarget.files![0])} type="file" accept="image/*" />
                <label htmlFor="file-upload">
                  <Button className='border-white text-white' variant="outlined" size='small' component="span">
                    Upload
                  </Button>
                </label>
                {form.values.thumbnail && (
                  <p className='text-[12px]'>{form.values.thumbnail.name}</p>
                )}
              </div>
            </div>
          </div>
          <div className='flex flex-col'>
            <p>Description</p>
            <TextField
              name="gameInvite.description"
              value={form.values.gameInvite.description}
              onChange={form.handleChange}
              InputProps={{
                classes: {
                  input: styles.inputForm,
                  notchedOutline: styles.inputBorder,
                },
              }}
              size='small'
              multiline
              rows={4}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        {success && <p className='text-green-500'>Game was created!</p>}
        {error && <p className='text-red-500'>{error}</p>}
        <Button className="hover:bg-hover-color text-white" onClick={resetForm}>Cancel</Button>
        <Button className={` ${(!form.isValid || form.values.location.address === '') ? 'text-[rgba(255,255,255,0.4)] pointer-events-none hover:bg-transparent' : 'text-white hover:bg-hover-color'}`} type='submit'>Create</Button>
      </DialogActions>
    </Dialog>
  )
}



