function MessageDisplay({ message }) {
    return (
      <div className="message-block">
        <p>{message.text}</p>
        {message.language && <p>Language: {message.language}</p>}
        {message.summary && <p>Summary: {message.summary}</p>}
        {message.translation && <p>Translation: {message.translation}</p>}
      </div>
    );
  }
  
  export default MessageDisplay;
  