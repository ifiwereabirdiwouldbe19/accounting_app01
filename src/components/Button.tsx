import { Text,TouchableOpacity,StyleSheet } from "react-native";

interface Props{
    label: string
    onPress?: ()=>void
}   

const Button = (props: Props):JSX.Element=>{
    const {label,onPress}=props;
    return(
            <TouchableOpacity onPress={onPress} style={styles.button}>
                <Text style={styles.buttonlabel}>{label}</Text>        
            </TouchableOpacity>
    )
}
const styles=StyleSheet.create({
        button:{
        backgroundColor:'#467fd3',
        height:48,
        borderRadius:4,
        alignSelf:'flex-start',
        marginBottom:24,
    },
    buttonlabel:{
        color:'#ffffff',
        fontSize:16,
        lineHeight:32,
        paddingVertical:8,
        paddingHorizontal:24,
        fontWeight:'bold',
    },

})
export default Button;