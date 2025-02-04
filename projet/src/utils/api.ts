const API_URL = 'http://pc235.fcourtage1.local:81';

export const sendMessage = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error:', error);
    throw new Error("Une erreur s'est produite lors de la communication avec le serveur.");
  }
};

