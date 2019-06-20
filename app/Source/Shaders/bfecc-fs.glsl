// Back and Forth Error Compensation And Correction
// This program applies the compensation after the back and forth advection
// computation.

precision mediump float;

uniform sampler2D velocity_field;
uniform sampler2D compensation_field;

varying vec2 surface_texcoord;

void main()
{
    vec4 velocity = texture2D(velocity_field, surface_texcoord);
    vec4 compensation = texture2D(compensation_field, surface_texcoord);
    gl_FragColor = velocity + 0.5 * (velocity - compensation);
}