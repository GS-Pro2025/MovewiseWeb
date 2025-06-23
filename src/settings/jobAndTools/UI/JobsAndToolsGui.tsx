import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    InputAdornment,
    Collapse,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Pagination 
} from '@mui/material';
import { AddCircleOutline, DeleteOutline, SearchOutlined, BuildOutlined, EditOutlined, CheckCircleOutline, CancelOutlined } from '@mui/icons-material'; // Added Edit, Check, Cancel icons
import { TransitionGroup } from 'react-transition-group';
import { useSnackbar } from 'notistack';
import { JobModel, JobsAndToolRepository, ToolModel } from '../data/JobsAndToolsRepository';


const jobsAndToolRepository = new JobsAndToolRepository();


interface ConfirmationDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ open, title, message, onConfirm, onCancel }) => {
    return (
        <Dialog open={open} onClose={onCancel}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="primary">
                    Cancelar
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    Confirmar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface ToolsDialogProps {
    open: boolean;
    job: JobModel | null; 
    onClose: () => void;
}

const ToolsDialog: React.FC<ToolsDialogProps> = ({ open, job, onClose }) => {
    const [tools, setTools] = useState<ToolModel[]>([]);
    const [newToolName, setNewToolName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { enqueueSnackbar } = useSnackbar();

    const [currentPage, setCurrentPage] = useState(1);
    const toolsPerPage = 5; 

    const [openToolConfirmDialog, setOpenToolConfirmDialog] = useState(false);
    const [toolToDelete, setToolToDelete] = useState<number | null>(null);

    const totalPages = useMemo(() => Math.ceil(tools.length / toolsPerPage), [tools.length, toolsPerPage]);

    const currentTools = useMemo(() => {
        const indexOfLastTool = currentPage * toolsPerPage;
        const indexOfFirstTool = indexOfLastTool - toolsPerPage;
        return tools.slice(indexOfFirstTool, indexOfLastTool);
    }, [tools, currentPage, toolsPerPage]);


    useEffect(() => {
        const fetchTools = async () => {
            if (!job) return; 
            setLoading(true);
            setError(null);
            try {
                const response = await jobsAndToolRepository.listToolsByJob(job.id);
                setTools(Array.isArray(response.results) ? response.results : []);
                setCurrentPage(1); 
            } catch (err) {
                console.error('Error loading tools:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido al cargar herramientas.');
                enqueueSnackbar('Error al cargar herramientas.', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            fetchTools();
            setNewToolName('');
            setError(null);
        }
    }, [open, job, enqueueSnackbar]); 

    const handleAddTool = async () => {
        if (!job) {
            enqueueSnackbar('No se ha seleccionado un trabajo para añadir la herramienta.', { variant: 'error' });
            return;
        }
        if (newToolName.trim() === '') {
            enqueueSnackbar('El nombre de la herramienta no puede estar vacío.', { variant: 'warning' });
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const addedTool = await jobsAndToolRepository.createTool(newToolName.trim(), job.id);
            setTools((prev) => [...prev, addedTool]);
            setNewToolName('');
            enqueueSnackbar('Herramienta añadida con éxito.', { variant: 'success' });
            setCurrentPage(Math.ceil((tools.length + 1) / toolsPerPage));
        } catch (err) {
            console.error('Error adding tool:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido al añadir herramienta.');
            enqueueSnackbar('Error al añadir herramienta.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteToolClick = (id: number) => {
        setToolToDelete(id);
        setOpenToolConfirmDialog(true);
    };

    const handleDeleteToolConfirm = async () => {
        if (toolToDelete === null) return;

        setLoading(true);
        setError(null);
        setOpenToolConfirmDialog(false); 
        try {
            await jobsAndToolRepository.deleteTool(toolToDelete);
            const updatedTools = tools.filter((tool) => tool.id !== toolToDelete);
            setTools(updatedTools);
            enqueueSnackbar('Herramienta eliminada con éxito.', { variant: 'success' });

            if (currentTools.length === 1 && currentPage > 1 && updatedTools.length > 0 && currentPage === totalPages) {
                setCurrentPage(prev => prev - 1);
            } else if (updatedTools.length === 0 && currentPage > 1) { 
                setCurrentPage(1);
            }
        } catch (err) {
            console.error('Error deleting tool:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido al eliminar herramienta.');
            enqueueSnackbar('Error al eliminar herramienta.', { variant: 'error' });
        } finally {
            setLoading(false);
            setToolToDelete(null); 
        }
    };

    const handleDeleteToolCancel = () => {
        setOpenToolConfirmDialog(false);
        setToolToDelete(null);
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                Herramientas para: {job?.name || 'Cargando...'}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    &times;
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Section to add new tool */}
                <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Nombre de la nueva herramienta"
                        variant="outlined"
                        fullWidth
                        value={newToolName}
                        onChange={(e) => setNewToolName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !loading) {
                                handleAddTool();
                            }
                        }}
                        disabled={loading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&.Mui-focused fieldset': {
                                    borderColor: '#007bff',
                                },
                            },
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddTool}
                        startIcon={<AddCircleOutline />}
                        disabled={loading}
                        sx={{
                            backgroundColor: '#007bff',
                            '&:hover': {
                                backgroundColor: '#0056b3',
                            },
                            borderRadius: 2,
                            py: 1.5,
                            px: 3,
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap', 
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Añadir'}
                    </Button>
                </Box>

                <Typography variant="h6" sx={{ mb: 2, color: '#444' }}>
                    Lista de Herramientas
                </Typography>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2, color: 'text.secondary' }}>Cargando herramientas...</Typography>
                    </Box>
                )}

                {!loading && tools.length === 0 && (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 4,
                            border: '1px dashed #ccc',
                            borderRadius: 2,
                            color: 'text.secondary',
                            backgroundColor: '#f0f0f0',
                        }}
                    >
                        <Typography variant="body1">No hay herramientas para este trabajo.</Typography>
                    </Box>
                )}

                {!loading && tools.length > 0 && (
                    <List
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            backgroundColor: '#fdfdfd',
                            border: '1px solid #eee',
                        }}
                    >
                        <TransitionGroup>
                            {currentTools.map((tool) => ( 
                                <Collapse key={tool.id}>
                                    <ListItem
                                        divider
                                        sx={{
                                            py: 1.5,
                                            px: 3,
                                            '&:hover': {
                                                backgroundColor: '#e6f7ff',
                                            },
                                        }}
                                    >
                                        <ListItemText
                                            primary={tool.name}
                                            primaryTypographyProps={{
                                                variant: 'body1',
                                                fontWeight: 'medium',
                                                color: '#333',
                                            }}
                                        />
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() => handleDeleteToolClick(tool.id)}
                                            disabled={loading}
                                            sx={{
                                                color: '#dc3545',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                                },
                                            }}
                                        >
                                            <DeleteOutline />
                                        </IconButton>
                                    </ListItem>
                                </Collapse>
                            ))}
                        </TransitionGroup>
                    </List>
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ color: '#007bff' }}>
                    Cerrar
                </Button>
                {totalPages > 1 && ( 
                    <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                borderRadius: 1.5,
                            },
                        }}
                    />
                )}
            </DialogActions>

            {/* Confirmation Dialog for Tool Deletion */}
            <ConfirmationDialog
                open={openToolConfirmDialog}
                title="Confirmar eliminación de herramienta"
                message="¿Estás seguro de que quieres eliminar esta herramienta?"
                onConfirm={handleDeleteToolConfirm}
                onCancel={handleDeleteToolCancel}
            />
        </Dialog>
    );
};

const JobsAndToolsGUI: React.FC = () => {
    const [jobs, setJobs] = useState<JobModel[]>([]);
    const [newJobName, setNewJobName] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { enqueueSnackbar } = useSnackbar();

    const [editingJobId, setEditingJobId] = useState<number | null>(null);
    const [editedJobName, setEditedJobName] = useState<string>('');

    const [openToolsDialog, setOpenToolsDialog] = useState<boolean>(false);
    const [selectedJob, setSelectedJob] = useState<JobModel | null>(null);

    const [openJobConfirmDialog, setOpenJobConfirmDialog] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<number | null>(null);


    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await jobsAndToolRepository.listJobs();
                setJobs(data);
            } catch (err) {
                console.error('Error loading jobs:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido al cargar trabajos.');
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const handleAddJob = async () => {
        if (newJobName.trim() === '') {
            enqueueSnackbar('El nombre del trabajo no puede estar vacío.', { variant: 'warning' });
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const addedJob = await jobsAndToolRepository.createJob(newJobName.trim());
            setJobs((prev) => [...prev, addedJob]);
            setNewJobName('');
            enqueueSnackbar('Trabajo añadido con éxito.', { variant: 'success' });
        } catch (err) {
            console.error('Error adding job:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido al añadir trabajo.');
            enqueueSnackbar('Error al añadir trabajo.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJobClick = (id: number) => {
        setJobToDelete(id);
        setOpenJobConfirmDialog(true);
    };

    const handleDeleteJobConfirm = async () => {
        if (jobToDelete === null) return;

        setLoading(true);
        setError(null);
        setOpenJobConfirmDialog(false); 
        try {
            await jobsAndToolRepository.deleteJob(jobToDelete);
            setJobs((prev) => prev.filter((job) => job.id !== jobToDelete));
            enqueueSnackbar('Trabajo eliminado con éxito.', { variant: 'success' });
        } catch (err) {
            console.error('Error deleting job:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido al eliminar trabajo.');
            enqueueSnackbar('Error al eliminar trabajo.', { variant: 'error' });
        } finally {
            setLoading(false);
            setJobToDelete(null); 
        }
    };

    const handleDeleteJobCancel = () => {
        setOpenJobConfirmDialog(false);
        setJobToDelete(null);
    };

    const handleOpenToolsDialog = (job: JobModel) => {
        setSelectedJob(job);
        setOpenToolsDialog(true);
    };

    const handleCloseToolsDialog = () => {
        setOpenToolsDialog(false);
        setSelectedJob(null); 
    };

    const handleEditJobClick = (job: JobModel) => {
        setEditingJobId(job.id);
        setEditedJobName(job.name);
    };

    const handleSaveJobEdit = async (jobId: number) => {
        if (editedJobName.trim() === '') {
            enqueueSnackbar('El nombre del trabajo no puede estar vacío.', { variant: 'warning' });
            return;
        }

        const originalJob = jobs.find(j => j.id === jobId);
        if (originalJob && originalJob.name === editedJobName.trim()) {
            enqueueSnackbar('No hay cambios para guardar.', { variant: 'info' });
            setEditingJobId(null);
            setEditedJobName('');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const updatedJob = await jobsAndToolRepository.editJob(jobId, editedJobName.trim());
            setJobs((prev) =>
                prev.map((job) => (job.id === updatedJob.id ? updatedJob : job))
            );
            enqueueSnackbar('Trabajo actualizado con éxito.', { variant: 'success' });
        } catch (err) {
            console.error('Error updating job:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido al actualizar trabajo.');
            enqueueSnackbar('Error al actualizar trabajo.', { variant: 'error' });
        } finally {
            setLoading(false);
            setEditingJobId(null); 
            setEditedJobName(''); 
        }
    };

    const handleCancelJobEdit = () => {
        setEditingJobId(null); 
        setEditedJobName(''); 
    };


    const filteredJobs = jobs.filter((job) =>
        job.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box
            sx={{
                flexGrow: 1,
                p: 4,
                backgroundColor: '#f8f9fa',
                minHeight: '100vh',
            }}
        >
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
                Gestión de Trabajos y Herramientas
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
                Aquí puedes gestionar la lista de trabajos y las herramientas asociadas a cada uno.
            </Typography>

            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    borderRadius: 3,
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                    backgroundColor: '#fff',
                }}
            >
                {/* Global error messages */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Section to add new job */}
                <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Nombre del nuevo trabajo"
                        variant="outlined"
                        fullWidth
                        value={newJobName}
                        onChange={(e) => setNewJobName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !loading) {
                                handleAddJob();
                            }
                        }}
                        disabled={loading || editingJobId !== null} 
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&.Mui-focused fieldset': {
                                    borderColor: '#007bff',
                                },
                            },
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddJob}
                        startIcon={<AddCircleOutline />}
                        disabled={loading || editingJobId !== null} 
                        sx={{
                            backgroundColor: '#007bff',
                            '&:hover': {
                                backgroundColor: '#0056b3',
                            },
                            borderRadius: 2,
                            py: 1.5,
                            px: 3,
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Añadir Trabajo'}
                    </Button>
                </Box>

                {/* Search section */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        label="Buscar trabajo"
                        variant="outlined"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading || editingJobId !== null} 
                        InputProps={{ 
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlined color="action" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&.Mui-focused fieldset': {
                                    borderColor: '#007bff',
                                },
                            },
                        }}
                    />
                </Box>

                {/* Job list */}
                <Typography variant="h6" sx={{ mb: 2, color: '#444' }}>
                    Lista de Trabajos
                </Typography>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2, color: 'text.secondary' }}>Cargando trabajos...</Typography>
                    </Box>
                )}

                {!loading && filteredJobs.length === 0 && (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 4,
                            border: '1px dashed #ccc',
                            borderRadius: 2,
                            color: 'text.secondary',
                            backgroundColor: '#f0f0f0',
                        }}
                    >
                        <Typography variant="body1">No se encontraron trabajos.</Typography>
                    </Box>
                )}

                {!loading && filteredJobs.length > 0 && (
                    <List
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            backgroundColor: '#fdfdfd',
                            border: '1px solid #eee',
                        }}
                    >
                        <TransitionGroup>
                            {filteredJobs.map((job) => (
                                <Collapse key={job.id}>
                                    <ListItem
                                        divider
                                        sx={{
                                            py: 1.5,
                                            px: 3,
                                            '&:hover': {
                                                backgroundColor: '#e6f7ff',
                                            },
                                        }}
                                        secondaryAction={
                                            <Box>
                                                {editingJobId === job.id ? (
                                            
                                                    <>
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="save"
                                                            onClick={() => handleSaveJobEdit(job.id)}
                                                            disabled={loading}
                                                            sx={{ color: '#28a745', mr: 1 }}
                                                        >
                                                            <CheckCircleOutline />
                                                        </IconButton>
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="cancel"
                                                            onClick={handleCancelJobEdit}
                                                            disabled={loading}
                                                            sx={{ color: '#ffc107', mr: 1 }}
                                                        >
                                                            <CancelOutlined />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    
                                                    <>
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="view tools"
                                                            onClick={() => handleOpenToolsDialog(job)}
                                                            disabled={loading || editingJobId !== null} // Disable if loading or another job is being edited
                                                            sx={{
                                                                color: '#007bff',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                                                                },
                                                                mr: 1,
                                                            }}
                                                        >
                                                            <BuildOutlined />
                                                        </IconButton>
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="edit"
                                                            onClick={() => handleEditJobClick(job)}
                                                            disabled={loading || editingJobId !== null} // Disable if loading or another job is being edited
                                                            sx={{
                                                                color: '#6c757d',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(108, 117, 125, 0.1)',
                                                                },
                                                                mr: 1, // Margin to separate from delete button
                                                            }}
                                                        >
                                                            <EditOutlined />
                                                        </IconButton>
                                                    </>
                                                )}
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete"
                                                    onClick={() => handleDeleteJobClick(job.id)}
                                                    disabled={loading || editingJobId !== null} // Disable if loading or another job is being edited
                                                    sx={{
                                                        color: '#dc3545',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                                        },
                                                    }}
                                                >
                                                    <DeleteOutline />
                                                </IconButton>
                                            </Box>
                                        }
                                    >
                                        {editingJobId === job.id ? (
                                            <TextField
                                                value={editedJobName}
                                                onChange={(e) => setEditedJobName(e.target.value)}
                                                onBlur={() => handleSaveJobEdit(job.id)} // Save on blur
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveJobEdit(job.id);
                                                    } else if (e.key === 'Escape') {
                                                        handleCancelJobEdit();
                                                    }
                                                }}
                                                variant="standard"
                                                fullWidth
                                                autoFocus // Focus the TextField when it appears
                                                disabled={loading}
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: 'medium',
                                                        color: '#333',
                                                    },
                                                }}
                                            />
                                        ) : (
                                            <ListItemText
                                                primary={job.name}
                                                primaryTypographyProps={{
                                                    variant: 'body1',
                                                    fontWeight: 'medium',
                                                    color: '#333',
                                                }}
                                            />
                                        )}
                                    </ListItem>
                                </Collapse>
                            ))}
                        </TransitionGroup>
                    </List>
                )}
            </Paper>

            {/* Tools Dialog */}
            <ToolsDialog
                open={openToolsDialog}
                job={selectedJob}
                onClose={handleCloseToolsDialog}
            />

            {/* Confirmation Dialog for Job Deletion */}
            <ConfirmationDialog
                open={openJobConfirmDialog}
                title="Confirmar eliminación de trabajo"
                message="¿Estás seguro de que quieres eliminar este trabajo? Se eliminarán también las herramientas asociadas."
                onConfirm={handleDeleteJobConfirm}
                onCancel={handleDeleteJobCancel}
            />
        </Box>
    );
};

export default JobsAndToolsGUI;
