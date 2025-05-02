import React from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  Tooltip,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { FaPlus, FaHeart, FaPlay, FaPause, FaDownload, FaEye, FaTrash } from 'react-icons/fa';
import Waveform from '../../Waveform/Waveform';
import useLikeSample from '../../../hooks/useLikeSample';
import useAudioPlayback from '../../../hooks/useAudioPlayback';
import useDownloadTrack from '../../../hooks/useDownloadTrack';
import useTrackSampleView from '../../../hooks/useTrackSampleView';
import useDeleteSample from '../../../hooks/useDeleteSample';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase/firebase';
import ArtistInfo from './ArtistInfo';
import SampleCover from './SampleCover';
import TagsList from './TagsList';

// This is now just a re-export of the main SampleRow component
// to maintain backward compatibility
import SampleRowMain from '../SampleRow';

const SampleRow = (props) => {
  return <SampleRowMain {...props} />;
};

export default SampleRow;
