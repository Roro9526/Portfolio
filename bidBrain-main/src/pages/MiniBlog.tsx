import React, { useState } from 'react';

interface Post {
    id: number;
    title: string;
    content: string;
    date: string;
    comments: Comment[];
}

interface Comment {
    id: number;
    content: string;
    date: string;
}

const MiniBlog: React.FC<{ cryptoId: string }> = ({ cryptoId }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});

    const addPost = () => {
        const post: Post = {
            id: posts.length + 1,
            title: newPost.title,
            content: newPost.content,
            date: new Date().toLocaleDateString(),
            comments: []
        };
        setPosts([...posts, post]);
        setNewPost({ title: '', content: '' });
    };

    const deletePost = (id: number) => {
        setPosts(posts.filter(post => post.id !== id));
    };

    const addComment = (postId: number) => {
        const comment: Comment = {
            id: posts.find(post => post.id === postId)!.comments.length + 1,
            content: newComment[postId],
            date: new Date().toLocaleDateString()
        };
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, comments: [...post.comments, comment] }
                : post
        ));
        setNewComment({ ...newComment, [postId]: '' });
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Mini-Blog pour {cryptoId}</h2>

            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <input
                    type="text"
                    placeholder="Titre"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full p-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                    placeholder="Contenu"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full p-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={addPost}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                    Publier
                </button>
            </div>

            <div className="space-y-6">
                {posts.map(post => (
                    <div key={post.id} className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800">{post.title}</h3>
                        <p className="text-gray-700">{post.content}</p>
                        <small className="text-gray-500">{post.date}</small>
                        <button
                            onClick={() => deletePost(post.id)}
                            className="ml-4 text-red-500 hover:text-red-600 transition"
                        >
                            Supprimer
                        </button>

                        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-700">Commentaires</h4>
                            <textarea
                                placeholder="Ajouter un commentaire"
                                value={newComment[post.id] || ''}
                                onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                                className="w-full p-2 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => addComment(post.id)}
                                className="mt-2 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            >
                                Commenter
                            </button>

                            <div className="mt-3 space-y-2">
                                {post.comments.map(comment => (
                                    <div key={comment.id} className="p-2 bg-white rounded-md border border-gray-200">
                                        <p className="text-gray-700">{comment.content}</p>
                                        <small className="text-gray-500">{comment.date}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    );
};

export default MiniBlog;