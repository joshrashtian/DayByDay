const sampleFriends = [{
  id: "1",
  name: "Jerome Mall"

}]
export default function SocialScreen() {
  return (
    <div className="justify-start items-startflex flex-col">
      <h2 className="font-black text-5xl  -skew-x-12 border-b-2 pb-3 border-slate-200/50">Your Circle</h2>
      {
        sampleFriends.map((prof) => (
          <div>
            {prof.name}
            {prof.id}
        </div>

        ))
      }
    </div>
  )
}
