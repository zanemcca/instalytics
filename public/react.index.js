
var { GoogleMap } = ReactGoogleMaps;
          //<GoogleMap></GoogleMap>

class Thing extends React.Component { 
  render() {
    var nodes = this.props.data.map(function(item) {
      return (
          <div key={item.id}>
            {item.text}
          </div>
      );
    });
    return (
      <div className="thing">
        {nodes}
        <div>
          {this.props.children}
        </div>
      </div>
    );
  }
};

class Box extends React.Component { 
  constructor(props) {
    super(props);
    this.state = {
      data: []
    };
  }
  loadDataFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data:data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  }
  componentDidMount() {
    this.loadDataFromServer();
    setInterval(this.loadDataFromServer.bind(this), this.props.pollInterval);
  }
  render() {
    return ( 
      <div className="box">
        Hello, world! I am a box!
        <Thing data={this.state.data}>
          <div>
            Some children
          </div>
        </Thing>
      </div>
    );
  }
};

ReactDOM.render(
  <Box url='/api/data' pollInterval={2000}/>,
  document.getElementById('content')
);
