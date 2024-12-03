import { Autocomplete, Button, Popper, TextField } from '@mui/material'
import styles from "./filterInput.module.css";
import { useState } from 'react';

interface FilterProps {
  calcOptions: () => string[],
  addClause: (newValue: string) => void,
  placeholder: string
}

export function FilterInput({calcOptions, addClause, placeholder}: FilterProps) {

  const [inputValue, setInputValue] = useState("");
  const options = calcOptions();

  const handleAddClause = () => {
    addClause(inputValue);
  }

  const handleInputChange = (value: string) => {
    setInputValue(value);
  }

  return (
    <div className='flex flex-row gap-2 items-center w-full'>
      <Autocomplete
        options={options}
        value={inputValue}
        onChange={(_event, newValue) => {handleInputChange(newValue!)}}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
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
        sx={{
          '.MuiAutocomplete-popupIndicator': {
            color: 'white'
          },
          flexGrow: 1
        }}
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
      <Button 
        variant='outlined' 
        onClick={handleAddClause}
        className={`${!inputValue ? 'text-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.4)] pointer-events-none hover:bg-transparent' : 'text-white border-white hover:bg-hover-color'}`} 
        size='small'
      >
        Add Filter
      </Button>
    </div>
  )
}
