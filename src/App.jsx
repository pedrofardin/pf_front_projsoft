import { useEffect, useState } from 'react';
import './App.css';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import { useAuth0 } from '@auth0/auth0-react';

function App() {
  const [token, setToken] = useState(null);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [nota, setNota] = useState(0);

  const [feedbacks, setFeedbacks] = useState([]);
  const [roles, setRoles] = useState([]);

  const {
    user,
    isAuthenticated,
    isLoading,
    getAccessTokenSilently
  } = useAuth0();

  // Quando obtém o token, busca e decodifica as roles e carrega os feedbacks
  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Email:', payload['https://musica-insper.com/email']);
      console.log('Roles:', payload['https://musica-insper.com/roles']);
      setRoles(payload['https://musica-insper.com/roles']);

      fetch('http://18.229.140.150:8080/feedbacks', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })
        .then(response => response.json())
        .then(data => setFeedbacks(data))
        .catch(error => alert(error));
    }
  }, [token]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);
      } catch (e) {
        console.error('Erro ao buscar token:', e);
      }
    };

    if (isAuthenticated) {
      fetchToken();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  function salvarFeedback() {
    fetch('http://18.229.140.150:8080/feedbacks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        titulo,
        descricao,
        nota
      })
    })
      .then(() => window.location.reload()) // força reload simples
      .catch(error => alert(error));
  }

  function excluir(id) {
    fetch('http://18.229.140.150:8080/feedbacks/' + id, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
      .then(() => window.location.reload())
      .catch(error => alert(error));
  }

  return (
    <>
      <div>
        <div>
          <img src={user.picture} alt={user.name} />
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <LogoutButton />
        </div>

        <h2>Enviar novo feedback</h2>
        <div>
          Título: <input type='text' onChange={e => setTitulo(e.target.value)} /><br />
          Descrição: <input type='text' onChange={e => setDescricao(e.target.value)} /><br />
          Nota (0 a 10): <input type='number' min={0} max={10} onChange={e => setNota(Number(e.target.value))} /><br />
          <button onClick={salvarFeedback}>Cadastrar</button>
        </div>

        <h2>Feedbacks</h2>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Descrição</th>
              <th>Nota</th>
              <th>Usuário</th>
              {roles.includes('ADMIN') && <th>Excluir</th>}
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((feedback, index) => (
              <tr key={index}>
                <td>{feedback.titulo}</td>
                <td>{feedback.descricao}</td>
                <td>{feedback.nota}</td>
                <td>{feedback.email}</td>
                {roles.includes('ADMIN') && (
                  <td>
                    <button onClick={() => excluir(feedback.id)}>Excluir</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;
