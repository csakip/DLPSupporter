export default function PanelTest() {

  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    console.log('mount');
    return (() => { console.log('unmount') })
  });

  return (
    <>
      <p>{time.toString()}</p>

      <button onClick={() => setTime(new Date())}>Go</button>
    </>
  );
}