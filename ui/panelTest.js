export default function PanelTest() {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    console.log('mount');
    return () => {
      console.log('unmount');
    };
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, time.toString()), /*#__PURE__*/React.createElement("button", {
    onClick: () => setTime(new Date())
  }, "Go"));
}