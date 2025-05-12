import axios from "axios";
import React, { useState, useEffect, forwardRef } from "react";
import "./StyleComp/Comment.css";
import { useParams } from "react-router-dom";

const CommentModal = forwardRef(({ taskId, onClose, onCreate }, ref) => {    
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedText, setEditedText] = useState("");
    const [userId, setUserId] = useState(null);
    const { teamId } = useParams();
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchComments();
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.userId);
    }, [taskId]);

    const fetchComments = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/teams/${teamId}/tasks/${taskId}/comments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setComments(response.data.comments);
        } catch (err) {
            console.error("Fehler beim Laden der Kommentare:", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(
                `http://localhost:5000/api/teams/${teamId}/tasks/${taskId}/comments`,
                { comment_text: newComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewComment("");
            fetchComments();
        } catch (err) {
            console.error("Fehler beim Speichern des Kommentars:", err);
        }
    };

    const handleEdit = async (commentId) => {
        try {
            await axios.put(
                `http://localhost:5000/api/teams/${teamId}/comments/${commentId}`,
                { comment_text: editedText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditingCommentId(null);
            setEditedText("");
            fetchComments();
        } catch (err) {
            console.error("Fehler beim Aktualisieren:", err);
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString("de-DE", {
            dateStyle: "short",
            timeStyle: "short",
        });
    };

    return (
        <div>
            <div ref={ref} className="modal-style-comment">
                <h2>Kommentare</h2>

                {/* Kommentar-Liste */}
                <div className="comment-list">
                    {comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                            <strong>{comment.author_name}</strong> <span>am {formatDate(comment.created_at)}</span>
                            {comment.updated_at && comment.updated_at !== comment.created_at && (
                                <div className="edited">Letzte Änderung: {formatDate(comment.updated_at)}</div>
                            )}

                            {editingCommentId === comment.id ? (
                                <>
                                    <textarea
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                    />
                                    <button onClick={() => handleEdit(comment.id)}>Speichern</button>
                                    <button onClick={() => setEditingCommentId(null)}>Abbrechen</button>
                                </>
                            ) : (
                                <p style={{ whiteSpace: "pre-wrap" }}>{comment.comment_text}</p>
                            )}

                            {comment.user_id === userId && editingCommentId !== comment.id && (
                                <button onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditedText(comment.comment_text);
                                }}>
                                    Bearbeiten
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleCreate} className="new-comment-form">
                    <textarea
                        placeholder="Neuen Kommentar schreiben..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        required
                    />
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Schließen</button>
                        <button type="submit">Speichern</button>
                    </div>
                </form>
            </div>
        </div>
    );
});

export default CommentModal;
