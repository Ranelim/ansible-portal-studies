import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

/**
 * Header search that matches RHDH SearchInput chrome without calling the
 * search API (stock SearchComponent shows "Error fetching results" here and
 * wrecks the masthead). Enter → /search?query=…
 */
export const PortalHeaderSearch = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  const submit = () => {
    const q = value.trim();
    if (!q) return;
    navigate(`/search?query=${encodeURIComponent(q)}`);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        maxWidth: 480,
        minWidth: 200,
      }}
    >
      <TextField
        fullWidth
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Search..."
        variant="standard"
        aria-label="Search"
        InputProps={{
          disableUnderline: true,
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'inherit', opacity: 0.7 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          input: { color: 'inherit', py: 0.75 },
          button: { color: 'inherit' },
          '& fieldset': { border: 'none' },
        }}
      />
    </Box>
  );
};
